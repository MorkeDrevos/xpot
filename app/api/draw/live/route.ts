// app/api/draw/live/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// UTC day bucket helper (MUST match how Draw.drawDate is written)
function utcDayStart(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0),
  );
}

/**
 * 7,000-day arc
 * If Day 7000 is 2044-10-12 (UTC day bucket), Day 1 is 2025-08-14.
 */
const TOTAL_DAYS = 7000;
const GENESIS_UTC = new Date(Date.UTC(2025, 7, 14, 0, 0, 0)); // 2025-08-14T00:00:00Z
const FINAL_UTC = new Date(Date.UTC(2044, 9, 12, 0, 0, 0)); // 2044-10-12T00:00:00Z

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function dayIndexFromUtcDayStart(dayStart: Date) {
  const ms = dayStart.getTime() - GENESIS_UTC.getTime();
  const idx = Math.floor(ms / 86400000) + 1;
  return clamp(idx, 1, TOTAL_DAYS);
}

export async function GET() {
  const today = utcDayStart(new Date());

  const draw = await prisma.draw.findUnique({
    where: { drawDate: today },
    select: {
      closesAt: true,
      status: true,
      drawDate: true,
    },
  });

  // If draw row is missing, still return the day index so UI can show "Day X of 7000"
  const dayIndex = dayIndexFromUtcDayStart(today);

  if (!draw || !draw.closesAt) {
    return NextResponse.json(
      {
        draw: null,
        arc: {
          dayIndex,
          totalDays: TOTAL_DAYS,
          daysRemaining: TOTAL_DAYS - dayIndex,
          genesisUtc: GENESIS_UTC.toISOString(),
          finalUtc: FINAL_UTC.toISOString(),
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }

  const normalizedStatus =
    draw.status === 'open' ? 'OPEN' : draw.status === 'completed' ? 'COMPLETED' : 'LOCKED';

  return NextResponse.json(
    {
      draw: {
        dailyXpot: 1_000_000,
        closesAt: draw.closesAt.toISOString(),
        status: normalizedStatus,
        drawDate: draw.drawDate.toISOString(),
      },
      arc: {
        dayIndex,
        totalDays: TOTAL_DAYS,
        daysRemaining: TOTAL_DAYS - dayIndex,
        genesisUtc: GENESIS_UTC.toISOString(),
        finalUtc: FINAL_UTC.toISOString(),
      },
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
