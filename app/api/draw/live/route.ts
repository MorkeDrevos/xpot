// app/api/draw/live/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const TOTAL_DAYS = 7000;

// UTC day bucket helper (MUST match how Draw.drawDate is written)
function utcDayStart(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0),
  );
}

function addNoStoreHeaders(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}

export async function GET() {
  try {
    const today = utcDayStart(new Date());

    // Find today's draw
    const draw = await prisma.draw.findUnique({
      where: { drawDate: today },
      select: {
        drawDate: true,
        closesAt: true,
        status: true,
      },
    });

    // Compute Day X of 7000 from DB truth (earliest drawDate = Day 1)
    const agg = await prisma.draw.aggregate({
      _min: { drawDate: true },
    });

    const genesis = agg._min.drawDate ? utcDayStart(agg._min.drawDate) : null;

    const dayIndex =
      genesis && draw?.drawDate
        ? Math.max(
            1,
            Math.floor((utcDayStart(draw.drawDate).getTime() - genesis.getTime()) / 86400000) + 1,
          )
        : 1;

    if (!draw || !draw.closesAt) {
      return addNoStoreHeaders(
        NextResponse.json({
          draw: null,
          progress: { dayIndex, totalDays: TOTAL_DAYS },
        }),
      );
    }

    return addNoStoreHeaders(
      NextResponse.json({
        draw: {
          // canonical daily amount
          dailyXpot: 1_000_000,
          closesAt: draw.closesAt.toISOString(),
          status:
            draw.status === 'open'
              ? 'OPEN'
              : draw.status === 'completed'
              ? 'COMPLETED'
              : 'LOCKED',
        },
        progress: { dayIndex, totalDays: TOTAL_DAYS },
      }),
    );
  } catch (err) {
    return addNoStoreHeaders(
      NextResponse.json(
        { draw: null, error: 'LIVE_DRAW_UNAVAILABLE' },
        { status: 200 },
      ),
    );
  }
}
