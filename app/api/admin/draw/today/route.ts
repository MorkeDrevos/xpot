// app/api/admin/draw/today/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorized(req: NextRequest) {
  const token =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  return token === process.env.XPOT_ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    // Get today's draw (by date, not ID)
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(today),
          lt: new Date(today + 'T23:59:59.999Z'),
        },
      },
    });

    if (!draw) {
      return NextResponse.json({
        ok: true,
        draw: {
          id: null,
          date: today,
          status: 'open',
          jackpotUsd: 0,
          rolloverUsd: 0,
          ticketsCount: 0,
        },
      });
    }

    // Count tickets for today
    const ticketsCount = await prisma.ticket.count({
      where: { drawId: draw.id },
    });

    return NextResponse.json({
      ok: true,
      draw: {
        id: draw.id,
        date: draw.drawDate.toISOString(),
        status: draw.isClosed ? 'closed' : 'open',
        jackpotUsd: Number(draw.jackpotUsd),
        rolloverUsd: Number(draw.rolloverUsd),
        ticketsCount,
      },
    });

  } catch (err) {
    console.error('[ADMIN TODAY DRAW]', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LOAD_TODAY_DRAW' },
      { status: 500 }
    );
  }
}
