// app/api/draw/today/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Helper: get start & end of "today" in UTC
function getTodayRangeUtc() {
  const now = new Date();

  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1); // tomorrow 00:00

  return { start, end };
}

export async function GET() {
  try {
    const { start, end } = getTodayRangeUtc();

    // Find today's draw by drawDate
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: start,
          lt: end,
        },
      },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_DRAW' },
        { status: 200 },
      );
    }

    // Map DB shape -> public API shape expected by the homepage
    const isClosed = draw.isClosed;

    // We don't have a closesAt column in the schema,
    // so treat "end of today (UTC)" as the close time.
    const closesAt = isClosed
      ? null
      : (() => {
          const c = new Date(start);
          c.setUTCHours(23, 59, 59, 999);
          return c.toISOString();
        })();

    const responseDraw = {
      id: draw.id,
      date: draw.drawDate.toISOString(), // full ISO; UI can format if needed
      status: isClosed ? 'closed' : 'open',
      closesAt,
      jackpotUsd: draw.jackpotUsd ?? 0,
      rolloverUsd: 0, // you can wire real rollover later if you add it
      ticketsCount: draw._count.tickets ?? 0,
    };

    return NextResponse.json(
      {
        ok: true,
        draw: responseDraw,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[XPOT] /api/draw/today error:', err);
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
