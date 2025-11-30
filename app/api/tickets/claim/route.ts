// app/api/tickets/claim/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getXpotBalanceUi } from '../../../../lib/solana';
import { REQUIRED_XPOT } from '../../../../lib/xpot';

const MIN_SOL_REQUIRED = 0.01;
const JACKPOT_USD = 10_000;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function getSolBalance(address: string): Promise<number> {
  const res = await fetch(`https://api.mainnet-beta.solana.com`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address],
    }),
  });

  const json = await res.json();
  const lamports = json?.result?.value || 0;
  return lamports / 1_000_000_000;
}

// Same code generator as on the client
function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}

// Shape we send back to the UI
type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: string;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: string;
  createdAt: string;
  walletAddress: string;
};

// Map Prisma TicketStatus → EntryStatus
function mapStatus(status: string | null | undefined): EntryStatus {
  switch (status) {
    case 'WON':
      return 'won';
    case 'CLAIMED':
      return 'claimed';
    case 'NOT_PICKED':
      return 'not-picked';
    case 'EXPIRED':
      return 'expired';
    case 'IN_DRAW':
    default:
      return 'in-draw';
  }
}

// Map Prisma Ticket + Draw to dashboard Entry
function toEntry(ticket: any, draw: any): Entry {
  const createdAt =
    ticket.createdAt instanceof Date
      ? ticket.createdAt.toISOString()
      : new Date(ticket.createdAt).toISOString();

  return {
    id: ticket.id,
    code: ticket.code,
    status: mapStatus(ticket.status),
    label: "Today's main jackpot • $10,000",
    jackpotUsd: `$${JACKPOT_USD.toLocaleString()}`,
    createdAt,
    walletAddress: ticket.wallet?.address ?? 'unknown',
  };
}

// ─────────────────────────────────────────────
// POST /api/tickets/claim
// ─────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.walletAddress !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Invalid body' },
        { status: 400 }
      );
    }

    const walletAddress = body.walletAddress.trim();

    if (!walletAddress) {
      return NextResponse.json(
        { ok: false, error: 'Empty wallet address' },
        { status: 400 }
      );
    }

    /* ───────── XPOT BALANCE GATE ───────── */
    try {
      const xpotBalance = await getXpotBalanceUi(walletAddress);

      if (xpotBalance < REQUIRED_XPOT) {
        return NextResponse.json(
          {
            ok: false,
            error: 'NOT_ENOUGH_XPOT',
            required: REQUIRED_XPOT,
            balance: xpotBalance,
          },
          { status: 403 }
        );
      }
    } catch (err) {
      console.error('Failed to check XPOT balance:', err);
      return NextResponse.json(
        { ok: false, error: 'XPOT_CHECK_FAILED' },
        { status: 500 }
      );
    }

    /* ───────── SOL BALANCE GATE ───────── */
    const solBalance = await getSolBalance(walletAddress);

    if (solBalance < MIN_SOL_REQUIRED) {
      return NextResponse.json(
        {
          ok: false,
          error: 'NOT_ENOUGH_SOL',
          required: MIN_SOL_REQUIRED,
          balance: solBalance,
        },
        { status: 403 }
      );
    }

    // ─────────────────────────────────────
    // 1) Find or create wallet + user
    // ─────────────────────────────────────

    let wallet = await prisma.wallet.findUnique({
      where: { address: walletAddress },
    });

    if (!wallet) {
      const user = await prisma.user.create({
        data: {
          xHandle: `wallet_${walletAddress.slice(0, 8)}_${Date.now().toString(
            36
          )}`,
        },
      });

      wallet = await prisma.wallet.create({
        data: {
          address: walletAddress,
          userId: user.id,
        },
      });
    }

    // ─────────────────────────────────────
    // 2) Find or create *today's* Draw row
    // ─────────────────────────────────────

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: start,
          lte: end,
        },
      },
    });

    if (!draw) {
      draw = await prisma.draw.create({
        data: {
          drawDate: new Date(),
        },
      });
    }

    // ─────────────────────────────────────
    // 3) Enforce one ticket per wallet/day
    // ─────────────────────────────────────

    let ticket = await prisma.ticket.findFirst({
      where: {
        walletId: wallet.id,
        drawId: draw.id,
      },
      include: {
        wallet: true,
      },
    });

    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          code: makeCode(),
          drawId: draw.id,
          walletId: wallet.id,
          userId: wallet.userId,
        },
        include: {
          wallet: true,
        },
      });
    }

    // ─────────────────────────────────────
    // 4) Load all tickets for this draw
    // ─────────────────────────────────────

    const ticketsDb = await prisma.ticket.findMany({
      where: { drawId: draw.id },
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: true,
      },
    });

    const entries: Entry[] = ticketsDb.map(t => toEntry(t, draw));
    const entry = toEntry(ticket, draw);

    return NextResponse.json(
      {
        ok: true,
        ticket: entry,
        tickets: entries,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in /api/tickets/claim', err);
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
