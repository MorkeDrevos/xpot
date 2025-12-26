// app/api/draw/live/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Canonical daily amount (keep server-truth here)
const DAILY_XPOT = 1_000_000;
const DAY_TOTAL = 7000;

// Day 1 of 7000 (UTC day bucket)
const GENESIS_UTC_DAY_1 = new Date(Date.UTC(2025, 11, 25, 0, 0, 0));

// Closing time (UTC hour) - default 21:00 UTC (22:00 Madrid in winter/CET)
// Override with env if you want:
const CLOSES_AT_UTC_HOUR = Number(process.env.XPOT_DAILY_CLOSE_UTC_HOUR ?? 21);
const CLOSES_AT_UTC_MIN = Number(process.env.XPOT_DAILY_CLOSE_UTC_MIN ?? 0);

type UiStatus = 'OPEN' | 'LOCKED' | 'COMPLETED';

function utcDayStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}
function utcDayEndExclusive(d: Date) {
  // start of next UTC day
  return new Date(utcDayStart(d).getTime() + 86400000);
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function dayNumberFromDrawDate(drawDateUtc: Date) {
  const ms = utcDayStart(drawDateUtc).getTime() - utcDayStart(GENESIS_UTC_DAY_1).getTime();
  const diffDays = Math.floor(ms / 86400000);
  return clamp(diffDays + 1, 1, DAY_TOTAL);
}

function normalizeStatus(dbStatus: string | null | undefined): UiStatus {
  const s = (dbStatus || '').toLowerCase();
  if (s === 'open') return 'OPEN';
  if (s === 'completed') return 'COMPLETED';
  return 'LOCKED';
}

function computeClosesAtForDay(dayUtcStart: Date) {
  // closesAt anchored to the UTC day bucket
  return new Date(
    Date.UTC(
      dayUtcStart.getUTCFullYear(),
      dayUtcStart.getUTCMonth(),
      dayUtcStart.getUTCDate(),
      CLOSES_AT_UTC_HOUR,
      CLOSES_AT_UTC_MIN,
      0,
      0,
    ),
  );
}

async function ensureTodayDraw(todayUtcStart: Date) {
  const tomorrowUtcStart = utcDayEndExclusive(todayUtcStart);
  const closesAt = computeClosesAtForDay(todayUtcStart);

  // 1) Find by RANGE (robust even if drawDate isn’t exactly midnight)
  const existing = await prisma.draw.findFirst({
    where: {
      drawDate: { gte: todayUtcStart, lt: tomorrowUtcStart },
    },
    select: { id: true, drawDate: true, closesAt: true, status: true },
    orderBy: { drawDate: 'asc' },
  });

  // 2) If missing, create (self-heal)
  if (!existing) {
    // NOTE:
    // - If your schema requires additional fields, add them here.
    // - Prefer drawDate = todayUtcStart so future lookups are stable.
    const created = await prisma.draw.create({
      data: {
        drawDate: todayUtcStart,
        closesAt,
        status: 'open',
      } as any,
      select: { drawDate: true, closesAt: true, status: true },
    });
    return created;
  }

  // 3) If exists but closesAt missing, patch it (self-heal)
  if (!existing.closesAt) {
    const patched = await prisma.draw.update({
      where: { id: existing.id },
      data: { closesAt },
      select: { drawDate: true, closesAt: true, status: true },
    });
    return patched;
  }

  return existing;
}

export async function GET() {
  try {
    const todayUtcStart = utcDayStart(new Date());
    const draw = await ensureTodayDraw(todayUtcStart);

    const dayNumber = dayNumberFromDrawDate(draw.drawDate);

    return NextResponse.json(
      {
        draw: {
          dailyXpot: DAILY_XPOT,
          dayNumber,
          dayTotal: DAY_TOTAL,
          drawDate: draw.drawDate.toISOString(),
          closesAt: draw.closesAt.toISOString(),
          status: normalizeStatus(draw.status),
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (err) {
    // If something truly fails (DB down etc) we still return draw:null,
    // but now it won’t happen due to “missing row” or “missing closesAt”.
    return NextResponse.json(
      { draw: null },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
