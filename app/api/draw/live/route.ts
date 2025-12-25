// app/api/draw/live/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// UTC day bucket helper (MUST match how Draw.drawDate is written)
function utcDayStart(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0),
  );
}

function normalizeStatus(s: string | null | undefined): 'OPEN' | 'LOCKED' | 'COMPLETED' {
  const v = String(s || '').toLowerCase();
  if (v === 'open') return 'OPEN';
  if (v === 'completed') return 'COMPLETED';
  return 'LOCKED';
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

  // Day number = count of draws up show far (treat first ever draw as Day 1)
  // This avoids hardcoding a “genesis date” and stays correct even if you change the schedule later.
  const dayNumber = await prisma.draw.count({
    where: { drawDate: { lte: today } },
  });

  const headers = { 'Cache-Control': 'no-store, max-age=0' };

  if (!draw || !draw.closesAt) {
    return NextResponse.json(
      {
        draw: null,
        progress: { dayNumber: Math.max(0, dayNumber), totalDays: 7000 },
      },
      { headers },
    );
  }

  return NextResponse.json(
    {
      draw: {
        dailyXpot: 1_000_000,
        closesAt: draw.closesAt.toISOString(),
        status: normalizeStatus(draw.status),
      },
      progress: {
        dayNumber: Math.max(1, dayNumber),
        totalDays: 7000,
      },
    },
    { headers },
  );
}
