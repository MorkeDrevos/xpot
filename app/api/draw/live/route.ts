// app/api/draw/live/route.ts
import { NextResponse } from 'next/server';
import { ensureActiveDraw } from '@/lib/ensureActiveDraw';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const DAILY_XPOT = 1_000_000;
const DAY_TOTAL = 7000;

// Day 1 of the 7000-day run (UTC midnight)
const GENESIS_UTC_DAY_1 = new Date(Date.UTC(2025, 11, 25, 0, 0, 0, 0));
const DAY_MS = 86_400_000;

function utcDayStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function dayNumberFromDrawDate(drawDateUtc: Date) {
  const ms = utcDayStart(drawDateUtc).getTime() - utcDayStart(GENESIS_UTC_DAY_1).getTime();
  const diffDays = Math.floor(ms / DAY_MS);
  return clamp(diffDays + 1, 1, DAY_TOTAL);
}

function normalizeStatus(status: string | null | undefined) {
  const s = (status ?? '').toLowerCase();
  if (s === 'open') return 'OPEN';
  if (s === 'completed') return 'COMPLETED';
  return 'LOCKED';
}

export async function GET() {
  try {
    const draw = await ensureActiveDraw(new Date());
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
    return NextResponse.json(
      { draw: null, error: err?.message || 'DRAW_LIVE_FAILED' },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
