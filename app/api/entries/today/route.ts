// app/api/entries/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(200, Math.floor(n)));
}

/**
 * Returns timezone offset in ms for a given timeZone at a given Date instant.
 * Positive means local time is ahead of UTC (e.g. Madrid usually +3600000).
 */
function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = dtf.formatToParts(date);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);

  const y = get('year');
  const m = get('month');
  const d = get('day');
  const hh = get('hour');
  const mm = get('minute');
  const ss = get('second');

  // same instant, interpreted as if it were UTC
  const asUtc = Date.UTC(y, m - 1, d, hh, mm, ss);
  return asUtc - date.getTime();
}

function madridDayRangeUtc(now = new Date()) {
  const tz = 'Europe/Madrid';

  // get Y/M/D in Madrid
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(now);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);

  const y = get('year');
  const m = get('month');
  const d = get('day');

  // Madrid midnight (00:00) expressed as a UTC instant:
  const utcMidnightGuess = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const off = getTimeZoneOffsetMs(utcMidnightGuess, tz);
  const startUtc = new Date(utcMidnightGuess.getTime() - off);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

  return { startUtc, endUtc };
}

export async function GET(req: NextRequest) {
  try {
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 24);
    const { startUtc, endUtc } = madridDayRangeUtc();

    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: { gte: startUtc, lt: endUtc },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
      },
    });

    // Minimal shape so your HomePageClient won't crash.
    // We'll wire real handle/avatar once we use the correct relation fields.
    const entries = tickets.map(t => ({
      id: t.id,
      createdAt: t.createdAt,
      handle: '',
      name: null,
      avatarUrl: null,
      verified: false,
    }));

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ entries: [] }, { status: 200 });
  }
}
