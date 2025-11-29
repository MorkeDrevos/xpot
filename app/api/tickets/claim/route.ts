// app/api/tickets/claim/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

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

// Map Prisma Ticket + Draw to dashboard Entry
function toEntry(ticket: any, draw: any): Entry {
  return {
    id: ticket.id,
    code: ticket.code,
    status: (ticket.status ?? 'in-draw') as EntryStatus,
    label: "Today's main jackpot • $10,000",
    jackpotUsd: `$${(draw.jackpotUsd ?? 10_000).toLocaleString()}`,
    createdAt: ticket.createdAt.toISOString(),
    walletAddress: ticket.walletAddress,
  };
}

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

    // ─────────────────────────────────────
    // 1) Find or create *today's* Draw row
    // ─────────────────────────────────────
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let draw = await prisma.draw.findFirst({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    if (!draw) {
      draw = await prisma.draw.create({
        data: {
          jackpotUsd: 10_000, // adjust later if dynamic
          status: 'open',
        },
      });
    }

    // ─────────────────────────────────────
    // 2) Enforce one ticket per wallet/day
    // ─────────────────────────────────────
    let ticket = await prisma.ticket.findFirst({
      where: {
        walletAddress,
        drawId: draw.id,
      },
    });

    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          code: makeCode(),
          status: 'in-draw',
          walletAddress,
          drawId: draw.id,
        },
      });
    }

    // ─────────────────────────────────────
    // 3) Load all tickets for this draw
    // ─────────────────────────────────────
    const ticketsDb = await prisma.ticket.findMany({
      where: { drawId: draw.id },
      orderBy: { createdAt: 'desc' },
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
