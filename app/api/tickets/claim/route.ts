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

/**
 * Use the SAME balance endpoint as the dashboard UI uses.
 * (and forward cookies for Vercel-protected DEV)
 */
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
    // ✅ enforce “account-level” claim (ties wallets to the signed-in user)
    const { userId: clerkId } = auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const walletAddress: string | undefined = body.walletAddress || body.wallet || body.address;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ ok: false, error: 'MISSING_WALLET' }, { status: 400 });
    }

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

    // 3) Ensure app User exists for this Clerk user
    const appUser = await prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: { clerkId },
      select: { id: true },
    });

    // 4) Ensure wallet row exists AND is linked to this user
    const wallet = await prisma.wallet.upsert({
      where: { address: walletAddress },
      update: { userId: appUser.id },
      create: { address: walletAddress, userId: appUser.id },
      select: { id: true, address: true, userId: true },
    });

    // 5) One ticket per wallet per draw (unique: [walletId, drawId])
    let ticket = await prisma.ticket.findFirst({
      where: { drawId: draw.id, walletId: wallet.id, status: 'IN_DRAW' },
      include: { wallet: true },
    });

    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          code: makeCode(),
          walletId: wallet.id,
          walletAddress: walletAddress,
          drawId: draw.id,
        },
        include: { wallet: true },
      });
    }

    // ✅ Return ALL tickets for this user for today’s draw (for multi-wallet UI)
    const allTickets = await prisma.ticket.findMany({
      where: {
        drawId: draw.id,
        wallet: { userId: appUser.id },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        status: true,
        walletAddress: true,
        createdAt: true,
      },
    });

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
            id: ticket.wallet?.id ?? wallet.id,
            address: ticket.wallet?.address ?? walletAddress,
          },
        },
        tickets: allTickets,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /tickets/claim error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
