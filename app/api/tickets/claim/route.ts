// app/api/tickets/claim/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { REQUIRED_XPOT } from '@/lib/xpot';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
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

  const startUtcMs = endUtcMs - 24 * 60 * 60_000;

  return { start: new Date(startUtcMs), end: new Date(endUtcMs) };
}

function getDrawBucketUtc(now = new Date()) {
  const { end } = getMadridCutoffWindowUtc(now);
  const insideWindow = new Date(end.getTime() - 1);

  const p = getTzParts(insideWindow, MADRID_TZ);
  return new Date(Date.UTC(p.y, p.m - 1, p.d, 0, 0, 0));
}

// ─────────────────────────────────────────────
// Helpers – code + XPOT balance check
// ─────────────────────────────────────────────

function makeCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const chunk = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${chunk()}-${chunk()}`;
}

async function getXpotBalanceFromSameEndpoint(req: NextRequest, address: string): Promise<number | null> {
  try {
    const origin = req.nextUrl.origin;
    const url = `${origin}/api/xpot-balance?address=${encodeURIComponent(address)}`;

    const cookie = req.headers.get('cookie') ?? '';

    const r = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'cache-control': 'no-store',
        cookie,
      },
    });

    if (!r.ok) return null;

    const j = (await r.json().catch(() => null)) as any;
    return j && typeof j.balance === 'number' && Number.isFinite(j.balance) ? j.balance : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const a = await auth();
    const clerkId = a.userId;

    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const walletAddress: string | undefined = body.walletAddress || body.wallet || body.address;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ ok: false, error: 'MISSING_WALLET' }, { status: 400 });
    }

    // Ensure User row exists for this Clerk identity
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: { clerkId },
    });

    // 1) XPOT minimum check (server-side)
    const xpotBalance = await getXpotBalanceFromSameEndpoint(req, walletAddress);

    if (xpotBalance === null) {
      return NextResponse.json({ ok: false, error: 'XPOT_CHECK_FAILED' }, { status: 400 });
    }

    if (xpotBalance < REQUIRED_XPOT) {
      return NextResponse.json(
        { ok: false, error: 'NOT_ENOUGH_XPOT', required: REQUIRED_XPOT, balance: xpotBalance },
        { status: 400 },
      );
    }

    // 2) Guarantee current draw exists + is open
    const now = new Date();
    const { end } = getMadridCutoffWindowUtc(now);
    const drawDate = getDrawBucketUtc(now);

    const draw = await prisma.$transaction(async tx => {
      const existing = await tx.draw.findUnique({ where: { drawDate } });

      if (!existing) {
        return tx.draw.create({
          data: {
            drawDate,
            closesAt: end,
            status: 'open',
          },
        });
      }

      const stillBeforeCutoff = now.getTime() < end.getTime();

      if (stillBeforeCutoff && existing.status !== 'open') {
        return tx.draw.update({
          where: { id: existing.id },
          data: { status: 'open', closesAt: end },
        });
      }

      if (!existing.closesAt || existing.closesAt.getTime() !== end.getTime()) {
        return tx.draw.update({
          where: { id: existing.id },
          data: { closesAt: end },
        });
      }

      return existing;
    });

    // 3) Ensure wallet row exists and is linked to the signed-in user
    const wallet = await prisma.wallet.upsert({
      where: { address: walletAddress },
      update: { userId: user.id },
      create: { address: walletAddress, userId: user.id },
    });

    // 4) One ticket per wallet per draw
    let ticket = await prisma.ticket.findFirst({
      where: { drawId: draw.id, walletAddress, status: 'IN_DRAW' },
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
        drawDate: draw.drawDate,
        closesAt: draw.closesAt,
        ticket: {
          id: ticket.id,
          code: ticket.code,
          status: ticket.status,
          walletAddress: ticket.walletAddress,
          createdAt: ticket.createdAt,
          wallet: {
            id: ticket.wallet?.id ?? null,
            address: ticket.wallet?.address ?? walletAddress,
          },
        },
        // keep compatible payload
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
    return NextResponse.json({ ok: false, error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
