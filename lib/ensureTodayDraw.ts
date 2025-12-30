// lib/ensureTodayDraw.ts
import { prisma } from '@/lib/prisma';

const MADRID_TZ = 'Europe/Madrid';
const CUTOFF_HH = 22;
const CUTOFF_MM = 0;

function getOffsetMinutes(date: Date, timeZone: string) {
  // Reads offset like "GMT+1" / "GMT+2"
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const tzPart = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  const m = tzPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/i);
  if (!m) return 0;

  const sign = m[1] === '-' ? -1 : 1;
  const hours = Number(m[2] || 0);
  const mins = Number(m[3] || 0);
  return sign * (hours * 60 + mins);
}

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

/**
 * Convert a *local* time in `timeZone` (y-m-d hh:mm) into a UTC Date.
 * Uses timezone offset at that instant (handles DST).
 */
function zonedTimeToUtc(
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
  timeZone: string,
) {
  // First guess: interpret as UTC, then subtract the zone offset at that instant.
  const guessUtcMs = Date.UTC(y, m - 1, d, hh, mm, 0);
  const offsetMin = getOffsetMinutes(new Date(guessUtcMs), timeZone);
  return new Date(guessUtcMs - offsetMin * 60_000);
}

function addDaysYMD(y: number, m: number, d: number, add: number) {
  // Safe day add using UTC date math
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + add);
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
  };
}

function getMadridCutoffWindow(now = new Date()) {
  const { y, m, d } = getTzParts(now, MADRID_TZ);

  const todayCutoffUtc = zonedTimeToUtc(y, m, d, CUTOFF_HH, CUTOFF_MM, MADRID_TZ);
  const nowMs = now.getTime();

  if (nowMs < todayCutoffUtc.getTime()) {
    // Window is [yesterday cutoff, today cutoff)
    const prev = addDaysYMD(y, m, d, -1);
    const startUtc = zonedTimeToUtc(prev.y, prev.m, prev.d, CUTOFF_HH, CUTOFF_MM, MADRID_TZ);
    const endUtc = todayCutoffUtc;
    return { startUtc, endUtc };
  }

  // Window is [today cutoff, tomorrow cutoff)
  const next = addDaysYMD(y, m, d, 1);
  const startUtc = todayCutoffUtc;
  const endUtc = zonedTimeToUtc(next.y, next.m, next.d, CUTOFF_HH, CUTOFF_MM, MADRID_TZ);
  return { startUtc, endUtc };
}

export async function ensureTodayDraw() {
  const { startUtc, endUtc } = getMadridCutoffWindow(new Date());

  // Check if a draw exists for the current Madrid cutoff window
  const existing = await prisma.draw.findFirst({
    where: {
      drawDate: { gte: startUtc, lt: endUtc },
    },
    orderBy: { drawDate: 'desc' },
  });

  if (existing) return existing;

  // Create the draw for this window
  const created = await prisma.draw.create({
    data: {
      drawDate: startUtc,
      status: 'open',
      closesAt: endUtc,
    },
  });

  return created;
}
