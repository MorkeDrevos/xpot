// app/api/draw/live/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// ─────────────────────────────────────────────
// Canonical server truths
// ─────────────────────────────────────────────
const DAILY_XPOT = 1_000_000;
const DAY_TOTAL = 7000;

// Day 1 of the 7000-day run (UTC midnight)
const GENESIS_UTC_DAY_1 = new Date(Date.UTC(2025, 11, 25, 0, 0, 0, 0));

// Default close time (UTC) – configurable
const CLOSES_AT_UTC_HOUR = Number(process.env.XPOT_DAILY_CLOSE_UTC_HOUR ?? 21);
const CLOSES_AT_UTC_MIN = Number(process.env.XPOT_DAILY_CLOSE_UTC_MIN ?? 0);

const DAY_MS = 86_400_000;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function utcDayStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function utcDayEndExclusive(d: Date) {
  return new Date(utcDayStart(d).getTime() + DAY_MS);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function dayNumberFromDrawDate(drawDateUtc: Date) {
  const ms = utcDayStart(drawDateUtc).getTime() - utcDayStart(GENESIS_UTC_DAY_1).getTime();
  const diffDays = Math.floor(ms / DAY_MS);
  return clamp(diffDays + 1, 1, DAY_TOTAL);
}

function computeClosesAtForDay(dayUtcStart: Date) {
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

function normalizeStatus(status: string | null | undefined) {
  const s = (status ?? '').toLowerCase();
  if (s === 'open') return 'OPEN';
  if (s === 'completed') return 'COMPLETED';
  return 'LOCKED';
}

// ─────────────────────────────────────────────
// Core invariant: today’s draw MUST exist
// ─────────────────────────────────────────────
type DrawLite = {
  id: string;
  drawDate: Date;
  closesAt: Date | null;
  status: string | null;
};

async function ensureTodayDraw(todayUtcStart: Date): Promise<DrawLite> {
  const tomorrowUtcStart = utcDayEndExclusive(todayUtcStart);
  const closesAt = computeClosesAtForDay(todayUtcStart);

  // Find by RANGE (robust even if drawDate ever isn't exactly midnight)
  const existing = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: todayUtcStart,
        lt: tomorrowUtcStart,
      },
    },
    orderBy: { drawDate: 'asc' },
    select: {
      id: true,
      drawDate: true,
      closesAt: true,
      status: true,
    },
  });

  // Self-heal: create if missing
  if (!existing) {
    return prisma.draw.create({
      data: {
        drawDate: todayUtcStart,
        closesAt,
        status: 'open',
      } as any,
      select: {
        id: true,
        drawDate: true,
        closesAt: true,
        status: true,
      },
    }) as unknown as DrawLite;
  }

  // Self-heal: patch closesAt if missing
  if (!existing.closesAt) {
    return prisma.draw.update({
      where: { id: existing.id },
      data: { closesAt },
      select: {
        id: true,
        drawDate: true,
        closesAt: true,
        status: true,
      },
    }) as unknown as DrawLite;
  }

  return existing as unknown as DrawLite;
}

// ─────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const todayUtcStart = utcDayStart(new Date());
    const draw = await ensureTodayDraw(todayUtcStart);

    // 🔒 Hard invariant for TS + runtime safety
    if (!draw.closesAt) throw new Error('Invariant violation: draw.closesAt is null');

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
  } catch (err: any) {
    // Only reachable on real system failure (DB down, migration mismatch, etc.)
    return NextResponse.json(
      { draw: null, error: err?.message || 'DRAW_LIVE_FAILED' },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
