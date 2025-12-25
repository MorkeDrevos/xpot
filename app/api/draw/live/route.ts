// app/api/draw/live/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Canonical daily amount (keep server-truth here)
const DAILY_XPOT = 1_000_000;
const DAY_TOTAL = 7000;

// Set your Day 1 (UTC) here.
// IMPORTANT: pick the exact UTC day you define as "Day 1 of 7000".
// If you already decided this elsewhere, match it exactly.
const GENESIS_UTC_DAY_1 = new Date(Date.UTC(2025, 11, 25, 0, 0, 0));

// UTC day bucket helper (MUST match how Draw.drawDate is written)
function utcDayStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function dayNumberFromDrawDate(drawDateUtc: Date) {
  const ms = utcDayStart(drawDateUtc).getTime() - utcDayStart(GENESIS_UTC_DAY_1).getTime();
  const diffDays = Math.floor(ms / 86400000);
  // Day 1 = genesis day
  return clamp(diffDays + 1, 1, DAY_TOTAL);
}

export async function GET() {
  const today = utcDayStart(new Date());

  const draw = await prisma.draw.findUnique({
    where: { drawDate: today },
    select: {
      drawDate: true,
      closesAt: true,
      status: true,
    },
  });

  if (!draw || !draw.closesAt) {
    return NextResponse.json(
      { draw: null },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }

  const dayNumber = dayNumberFromDrawDate(draw.drawDate);

  return NextResponse.json(
    {
      draw: {
        dailyXpot: DAILY_XPOT,
        dayNumber,
        dayTotal: DAY_TOTAL,

        drawDate: draw.drawDate.toISOString(),
        closesAt: draw.closesAt.toISOString(),

        // normalize status to what UI expects
        status:
          draw.status === 'open'
            ? 'OPEN'
            : draw.status === 'completed'
            ? 'COMPLETED'
            : 'LOCKED',
      },
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
