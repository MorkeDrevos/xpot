// app/api/bonus/live/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type ApiBonus = {
  id: string;
  amountXpot: number;
  scheduledAt: string; // ISO
  status: 'UPCOMING' | 'CLAIMED';
};

function getMadridParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: string, fallback = '0') =>
    Number(parts.find(p => p.type === type)?.value ?? fallback);

  return {
    y: get('year', '0'),
    m: get('month', '1'),
    d: get('day', '1'),
    hh: get('hour', '0'),
    mm: get('minute', '0'),
    ss: get('second', '0'),
  };
}

function getMadridOffsetMs(now = new Date()) {
  const p = getMadridParts(now);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return asUtc - now.getTime();
}

function mkUtcFromMadridWallClock(
  yy: number,
  mm: number,
  dd: number,
  hh: number,
  mi: number,
  ss: number,
  offsetMs: number,
) {
  const asUtc = Date.UTC(yy, mm - 1, dd, hh, mi, ss);
  return new Date(asUtc - offsetMs);
}

function getMadridDayBoundsUtc(now = new Date()) {
  const p = getMadridParts(now);
  const offsetMs = getMadridOffsetMs(now);

  const startUtc = mkUtcFromMadridWallClock(p.y, p.m, p.d, 0, 0, 0, offsetMs);
  const endUtc = mkUtcFromMadridWallClock(p.y, p.m, p.d, 23, 59, 59, offsetMs);

  return { startUtc, endUtc };
}

export async function GET() {
  try {
    const now = new Date();
    const { startUtc, endUtc } = getMadridDayBoundsUtc(now);

    // Adjust model/field names here only if your Prisma schema differs.
    const rows = await prisma.bonusDrop.findMany({
      where: {
        scheduledAt: {
          gte: startUtc,
          lte: endUtc,
        },
      },
      orderBy: { scheduledAt: 'desc' },
      select: {
        id: true,
        amountXpot: true,
        scheduledAt: true,
        status: true,
        claimedAt: true,
      },
      take: 25,
    });

    const bonus: ApiBonus[] = rows.map(r => {
      // Prefer DB enum if present, otherwise derive something safe for UI
      const derived: ApiBonus['status'] =
        r.status === 'CLAIMED' || r.claimedAt ? 'CLAIMED' : 'UPCOMING';

      return {
        id: r.id,
        amountXpot: Number(r.amountXpot),
        scheduledAt: r.scheduledAt.toISOString(),
        status: derived,
      };
    });

    return NextResponse.json({ bonus });
  } catch (e) {
    // Safe default: don’t show bonus block if DB is unavailable
    return NextResponse.json({ bonus: [] }, { status: 200 });
  }
}
