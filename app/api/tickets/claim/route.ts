// app/api/tickets/claim/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { REQUIRED_XPOT } from '@/lib/xpot';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────
// Madrid cutoff logic (22:00 Europe/Madrid)
// Window: [last cutoff, next cutoff)
// ─────────────────────────────────────────────

const MADRID_TZ = 'Europe/Madrid';
const MADRID_CUTOFF_HH = 22;
const MADRID_CUTOFF_MM = 0;

function getTzParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const pick = (type: string) => parts.find(p => p.type === type)?.value ?? '00';

  return {
    y: Number(pick('year')),
    m: Number(pick('month')),
    d: Number(pick('day')),
    hh: Number(pick('hour')),
    mm: Number(pick('minute')),
    ss: Number(pick('second')),
  };
}

function wallClockToUtcMs({
  y,
  m,
  d,
  hh,
  mm,
  ss,
  timeZone,
}: {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
  ss: number;
  timeZone: string;
}) {
  let t = Date.UTC(y, m - 1, d, hh, mm, ss);

  for (let i = 0; i < 3; i++) {
    const got = getTzParts(new Date(t), timeZone);
    const wantTotal = (((y * 12 + m) * 31 + d) * 24 + hh) * 60 + mm;
    const gotTotal = (((got.y * 12 + got.m) * 31 + got.d) * 24 + got.hh) * 60 + got.mm;
    const diffMin = gotTotal - wantTotal;
    if (diffMin === 0) break;
    t -= diffMin * 60_000;
  }

  return t;
}

function getMadridCutoffWindowUtc(now = new Date()) {
  const madridNow = getTzParts(now, MADRID_TZ);
  const nowMin = madridNow.hh * 60 + madridNow.mm;
  const cutoffMin = MADRID_CUTOFF_HH * 60 + MADRID_CUTOFF_MM;

  const baseForNext = nowMin < cutoffMin ? now : new Date(now.getTime() + 24 * 60 * 60_000);
  const nextDayParts = getTzParts(baseForNext, MADRID_TZ);

  const endUtcMs = wallClockToUtcMs({
    y: nextDayParts.y,
    m: nextDayParts.m,
    d: nextDayParts.d,
    hh: MADRID_CUTOFF_HH,
    mm: MADRID_CUTOFF_MM,
    ss: 0,
    timeZone: MADRID_TZ,
  });

  return {
    start: new Date(endUtcMs - 24 * 60 * 60_000),
    end: new Date(endUtcMs),
  };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function makeCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const chunk = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${chunk()}-${chunk()}`;
}

async function getXpotBalance(address: string): Promise<number> {
  const XPOT_MINT = process.env.XPOT_MINT;
  if (!XPOT_MINT) throw new Error('XPOT_MINT not configured');

  const res = await fetch('https://api.mainnet-beta.solana.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [address, { mint: XPOT_MINT }, { encoding: 'jsonParsed' }],
    }),
  });

  const json = await res.json().catch(() => null);
  const accounts = json?.result?.value ?? [];

  if (!Array.isArray(accounts) || accounts.length === 0) return 0;

  let rawTotal = 0n;
  let decimals = 6;

  for (const acc of accounts) {
    const info = acc?.account?.data?.parsed?.info;
    const tokenAmount = info?.tokenAmount;
    if (!tokenAmount?.amount) continue;

    rawTotal += BigInt(tokenAmount.amount);
    decimals = tokenAmount.decimals ?? decimals;
  }

  return Number(rawTotal) / Math.pow(10, decimals);
}

// ─────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const walletAddress: string | undefined =
      body.walletAddress || body.wallet || body.address;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ ok: false, error: 'MISSING_WALLET' }, { status: 400 });
    }

    // XPOT eligibility check (ONLY thing we care about)
    let xpotBalance = 0;
    try {
      xpotBalance = await getXpotBalance(walletAddress);

      if (!Number.isFinite(xpotBalance)) {
        return NextResponse.json({ ok: false, error: 'XPOT_CHECK_FAILED' }, { status: 400 });
      }

      if (xpotBalance < REQUIRED_XPOT) {
        return NextResponse.json(
          {
            ok: false,
            error: 'NOT_ENOUGH_XPOT',
            required: REQUIRED_XPOT,
            balance: xpotBalance,
          },
          { status: 400 },
        );
      }
    } catch (e) {
      console.error('[XPOT] balance check failed', e);
      return NextResponse.json({ ok: false, error: 'XPOT_CHECK_FAILED' }, { status: 400 });
    }

    // Find open draw for current Madrid window
    const { start, end } = getMadridCutoffWindowUtc(new Date());

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: start, lt: end },
        status: 'open',
      },
    });

    if (!draw) {
      return NextResponse.json({ ok: false, error: 'NO_OPEN_DRAW' }, { status: 400 });
    }

    // Ensure wallet exists
    const wallet = await prisma.wallet.upsert({
      where: { address: walletAddress },
      update: {},
      create: { address: walletAddress },
    });

    // Check existing ticket
    let ticket = await prisma.ticket.findFirst({
      where: {
        drawId: draw.id,
        walletAddress,
        status: 'IN_DRAW',
      },
      include: { wallet: true },
    });

    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          code: makeCode(),
          walletId: wallet.id,
          walletAddress,
          drawId: draw.id,
        },
        include: { wallet: true },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        drawId: draw.id,
        ticket: {
          id: ticket.id,
          code: ticket.code,
          status: ticket.status,
          walletAddress: ticket.walletAddress,
          createdAt: ticket.createdAt,
        },
        tickets: [
          {
            id: ticket.id,
            code: ticket.code,
            status: ticket.status,
            walletAddress: ticket.walletAddress,
            createdAt: ticket.createdAt,
          },
        ],
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /tickets/claim error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
