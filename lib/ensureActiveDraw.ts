// lib/ensureActiveDraw.ts
import { prisma } from '@/lib/prisma';

const MADRID_TZ = 'Europe/Madrid';
const CUTOFF_HH = 22;
const CUTOFF_MM = 0;

type DrawLite = {
  id: string;
  drawDate: Date;
  closesAt: Date | null;
  status: string | null;
};

// Compute timezone offset in ms for a given Date in a specific IANA timezone.
// Returns: (wallClockAsUTC - realUTC) for that instant.
function getTzOffsetMs(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00';

  const y = Number(get('year'));
  const m = Number(get('month'));
  const d = Number(get('day'));
  const hh = Number(get('hour'));
  const mm = Number(get('minute'));
  const ss = Number(get('second'));

  const asUTC = Date.UTC(y, m - 1, d, hh, mm, ss);
  return asUTC - date.getTime();
}

// Convert a Madrid wall-clock timestamp (y,m,d,hh,mm,ss) into UTC ms safely (DST aware).
function madridWallClockToUtcMs(y: number, m: number, d: number, hh: number, mm: number, ss: number) {
  const utcGuessMs = Date.UTC(y, m - 1, d, hh, mm, ss);
  const guessDate = new Date(utcGuessMs);
  const offsetMs = getTzOffsetMs(guessDate, MADRID_TZ);
  return utcGuessMs - offsetMs;
}

function addDaysUtc(ms: number, days: number) {
  return ms + days * 24 * 60 * 60 * 1000;
}

function getMadridNowParts(now: Date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: MADRID_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00';

  return {
    y: Number(get('year')),
    m: Number(get('month')),
    d: Number(get('day')),
    hh: Number(get('hour')),
    mm: Number(get('minute')),
    ss: Number(get('second')),
  };
}

// Madrid day bucket with cutoff at 22:00 local time.
// If Madrid time is before 22:00, the bucket started yesterday at 22:00.
// If Madrid time is >= 22:00, the bucket starts today at 22:00.
// Returns UTC [start, endExclusive).
function getActiveRangeMadridCutoffUtc(date: Date) {
  const madrid = getMadridNowParts(date);

  const beforeCutoff = madrid.hh < CUTOFF_HH || (madrid.hh === CUTOFF_HH && madrid.mm < CUTOFF_MM);

  const startUtcMsToday = madridWallClockToUtcMs(madrid.y, madrid.m, madrid.d, CUTOFF_HH, CUTOFF_MM, 0);
  const startUtcMs = beforeCutoff ? addDaysUtc(startUtcMsToday, -1) : startUtcMsToday;
  const endUtcMs = addDaysUtc(startUtcMs, 1);

  return { start: new Date(startUtcMs), end: new Date(endUtcMs) };
}

export async function ensureActiveDraw(date: Date = new Date()): Promise<DrawLite> {
  const { start, end } = getActiveRangeMadridCutoffUtc(date);

  const existing = await prisma.draw.findFirst({
    where: {
      drawDate: { gte: start, lt: end },
    },
    orderBy: [{ drawDate: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      drawDate: true,
      closesAt: true,
      status: true,
    },
  });

  // Create if missing
  if (!existing) {
    return (await prisma.draw.create({
      data: {
        drawDate: start,
        closesAt: end,
        status: 'open',
      } as any,
      select: {
        id: true,
        drawDate: true,
        closesAt: true,
        status: true,
      },
    })) as unknown as DrawLite;
  }

  // Patch closesAt if missing
  if (!existing.closesAt) {
    return (await prisma.draw.update({
      where: { id: existing.id },
      data: { closesAt: end },
      select: {
        id: true,
        drawDate: true,
        closesAt: true,
        status: true,
      },
    })) as unknown as DrawLite;
  }

  return existing as unknown as DrawLite;
}
