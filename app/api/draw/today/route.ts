// app/api/draw/today/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Helper: start/end of today in UTC
function getTodayRangeUtc() {
  const now = new Date();
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function GET() {
  try {
    const { start, end } = getTodayRangeUtc();

    // 1) Try to find today’s draw
    let draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: start,
          lt: end,
        },
      },
    });

    // 2) If missing, auto-create it (prevents NO_DRAW)
    if (!draw) {
      draw = await prisma.draw.create({
        data: {
          id: `auto-${start.toISOString()}`, // or omit to let cuid() generate
          drawDate: start,
          isClosed: false,
          jackpotUsd: 0, // adjust default if you want
        },
      });
    }

    // 3) Count tickets for this draw
    const ticketsCount = await prisma.ticket.count({
      where: { drawId: draw.id },
    });

    // 4) Compute closesAt: use DB value if set, otherwise end of day UTC
    const closesAtIso =
      draw.closesAt?.toISOString() ?? end.toISOString();

    const status: 'open' | 'closed' = draw.isClosed ? 'closed' : 'open';

    return NextResponse.json({
      ok: true,
      draw: {
        id: draw.id,
        date: draw.drawDate.toISOString(),
        status,
        jackpotUsd: draw.jackpotUsd ?? 0,
        closesAt: closesAtIso,
        ticketsCount,
      },
    });
  } catch (err) {
    console.error('[XPOT] /api/draw/today error:', err);
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
