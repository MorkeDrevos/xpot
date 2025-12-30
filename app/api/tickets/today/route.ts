// app/api/tickets/today/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

type UiStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

function toUiStatus(raw: any): UiStatus {
  const s = String(raw ?? '').trim();

  // already UI format
  if (s === 'in-draw' || s === 'expired' || s === 'not-picked' || s === 'won' || s === 'claimed') {
    return s;
  }

  // common DB enum formats
  const up = s.toUpperCase();

  if (up === 'IN_DRAW' || up === 'IN-DRAW') return 'in-draw';
  if (up === 'NOT_PICKED' || up === 'NOT-PICKED') return 'not-picked';
  if (up === 'WON') return 'won';
  if (up === 'CLAIMED') return 'claimed';
  if (up === 'EXPIRED') return 'expired';

  return 'in-draw';
}

// ─────────────────────────────────────────────
// Madrid cutoff logic (same as claim route)
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
    // ✅ must be signed in (dashboard is “account-level”)
    const { userId: clerkId } = auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Find the app User row for this Clerk user
    const appUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    // If user row doesn’t exist yet, treat as no tickets (sync-x should create it)
    if (!appUser?.id) {
      return NextResponse.json({ ok: true, draw: null, tickets: [] });
    }

    // ✅ Use the SAME draw bucket as claim route (Madrid cutoff logic)
    const now = new Date();
    const drawDate = getDrawBucketUtc(now);

    const drawRecord = await prisma.draw.findUnique({
      where: { drawDate },
      select: {
        id: true,
        drawDate: true,
        status: true,
        jackpotUsd: true,
        rolloverUsd: true,
      },
    });

    if (!drawRecord) {
      return NextResponse.json({ ok: true, draw: null, tickets: [] });
    }

    // ✅ Only tickets from wallets linked to THIS user
    const ticketsDb = await prisma.ticket.findMany({
      where: {
        drawId: drawRecord.id,
        wallet: {
          userId: appUser.id,
        },
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
    });

    const tickets = ticketsDb.map(t => ({
      id: t.id,
      code: t.code,
      status: toUiStatus(t.status),
      label: t.label ?? 'Ticket for today’s draw',
      jackpotUsd: drawRecord.jackpotUsd ?? 10_000,
      createdAt: t.createdAt,
      walletAddress: String(t.walletAddress ?? ''),
    }));

    return NextResponse.json({
      ok: true,
      draw: {
        id: drawRecord.id,
        drawDate: drawRecord.drawDate,
        status: String(drawRecord.status ?? 'open'),
        jackpotUsd: drawRecord.jackpotUsd ?? 10_000,
        rolloverUsd: drawRecord.rolloverUsd ?? 0,
      },
      tickets,
    });
  } catch (err) {
    console.error('GET /api/tickets/today error', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
