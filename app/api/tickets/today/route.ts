// app/api/tickets/today/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type UiStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

function toUiStatus(raw: any): UiStatus {
  const s = String(raw ?? '').trim();

  if (s === 'in-draw' || s === 'expired' || s === 'not-picked' || s === 'won' || s === 'claimed') return s;

  const up = s.toUpperCase();
  if (up === 'IN_DRAW' || up === 'IN-DRAW') return 'in-draw';
  if (up === 'NOT_PICKED' || up === 'NOT-PICKED') return 'not-picked';
  if (up === 'WON') return 'won';
  if (up === 'CLAIMED') return 'claimed';
  if (up === 'EXPIRED') return 'expired';

  return 'in-draw';
}

// ─────────────────────────────────────────────
// Madrid cutoff logic (22:00 Europe/Madrid)
// SAME bucket logic as claim route
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

export async function GET() {
  try {
    // ✅ account-level identity (Clerk)
    const { userId: clerkId } = auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Find app user + wallets
    const appUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!appUser?.id) {
      return NextResponse.json({ ok: true, draw: null, tickets: [] });
    }

    const wallets = await prisma.wallet.findMany({
      where: { userId: appUser.id },
      select: { id: true, address: true },
    });

    if (!wallets.length) {
      return NextResponse.json({ ok: true, draw: null, tickets: [] });
    }

    // Today by Madrid cutoff window bucket
    const drawDate = getDrawBucketUtc(new Date());

    const draw = await prisma.draw.findUnique({
      where: { drawDate },
      select: {
        id: true,
        drawDate: true,
        status: true,
        closesAt: true,
        tickets: {
          where: {
            walletId: { in: wallets.map(w => w.id) },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            code: true,
            status: true,
            label: true,
            createdAt: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!draw) {
      return NextResponse.json({ ok: true, draw: null, tickets: [] });
    }

    const tickets = (draw.tickets ?? []).map(t => ({
      id: t.id,
      code: t.code,
      status: toUiStatus(t.status),
      label: t.label ?? 'Ticket for today’s draw',
      createdAt: t.createdAt,
      walletAddress: String(t.walletAddress ?? ''),
    }));

    return NextResponse.json({
      ok: true,
      draw: {
        id: draw.id,
        drawDate: draw.drawDate,
        status: String(draw.status ?? 'open'),
        closesAt: draw.closesAt ?? null,
      },
      tickets,
    });
  } catch (err) {
    console.error('GET /api/tickets/today error', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
