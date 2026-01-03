// app/api/draw/live/route.ts
import { NextResponse } from 'next/server';
import { ensureActiveDraw } from '@/lib/ensureActiveDraw';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const DAILY_XPOT = 1_000_000;
const DAY_TOTAL = 7000;

// Canonical cadence (must match homepage)
const CLOSE_HOUR_MADRID = 22;
const CLOSE_MINUTE_MADRID = 0;
const CLOSE_SECOND_MADRID = 0;

const MADRID_TZ = 'Europe/Madrid';

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

function isCompleted(status: string | null | undefined) {
  return (status ?? '').toLowerCase() === 'completed';
}

/**
 * Extract Madrid-local YYYY-MM-DD for a given UTC Date.
 */
function getMadridYMD(d: Date): { y: number; m: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = fmt.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  const y = Number(get('year'));
  const m = Number(get('month'));
  const day = Number(get('day'));

  if (![y, m, day].every((n) => Number.isFinite(n))) {
    // Fallback (should never happen)
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, day: d.getUTCDate() };
  }

  return { y, m, day };
}

/**
 * Convert a Madrid-local date/time to a UTC Date.
 * Handles DST by iterating to find the correct offset.
 */
function madridLocalToUtcDate(
  y: number,
  m: number,
  day: number,
  hh: number,
  mm: number,
  ss: number,
) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  function partsToUtcMs(date: Date) {
    const parts = fmt.formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    const yy = Number(get('year'));
    const m2 = Number(get('month'));
    const dd = Number(get('day'));
    const h2 = Number(get('hour'));
    const mi2 = Number(get('minute'));
    const s2 = Number(get('second'));
    return Date.UTC(yy, m2 - 1, dd, h2, mi2, s2);
  }

  // Start from naive UTC guess
  let guessUtc = Date.UTC(y, m - 1, day, hh, mm, ss);

  // Converge DST offset
  for (let i = 0; i < 3; i++) {
    const shownAsMadridUtc = partsToUtcMs(new Date(guessUtc));
    const offsetMs = shownAsMadridUtc - guessUtc;
    const targetUtc = Date.UTC(y, m - 1, day, hh, mm, ss) - offsetMs;

    if (Math.abs(targetUtc - guessUtc) < 500) {
      guessUtc = targetUtc;
      break;
    }
    guessUtc = targetUtc;
  }

  return new Date(guessUtc);
}

function deriveLiveStatus(now: Date, closesAt: Date, dbStatus: string | null | undefined) {
  // Completed is authoritative
  if (isCompleted(dbStatus)) return 'COMPLETED';

  // OPEN/LOCKED is derived from canonical closesAt (matching homepage)
  return now.getTime() < closesAt.getTime() ? 'OPEN' : 'LOCKED';
}

export async function GET() {
  try {
    const now = new Date();

    // Keep your existing draw selection logic (do not change rules here)
    const draw = await ensureActiveDraw(now);

    const dayNumber = dayNumberFromDrawDate(draw.drawDate);

    // Canonical closesAt: 22:00 Madrid for the draw’s Madrid-local date
    const { y, m, day } = getMadridYMD(draw.drawDate);
    const canonicalClosesAt = madridLocalToUtcDate(
      y,
      m,
      day,
      CLOSE_HOUR_MADRID,
      CLOSE_MINUTE_MADRID,
      CLOSE_SECOND_MADRID,
    );

    const status = deriveLiveStatus(now, canonicalClosesAt, draw.status);

    return NextResponse.json(
      {
        draw: {
          dailyXpot: DAILY_XPOT,
          dayNumber,
          dayTotal: DAY_TOTAL,
          drawDate: draw.drawDate.toISOString(),
          closesAt: canonicalClosesAt.toISOString(),
          status,
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
