// app/api/admin/draw/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorized(req: NextRequest) {
  const header =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!header || header !== process.env.XPOT_ADMIN_TOKEN) {
    return false;
  }

  return true;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const now = new Date();

  // Normalise to current UTC day
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  // Find today's draw in DB
  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      tickets: true,
    },
  });

  // If there is no draw row for today, return a sane default
  if (!draw) {
    return NextResponse.json({
      ok: true,
      draw: {
        id: 'no-draw-today',
        date: now.toISOString().slice(0, 10),
        drawDate: now.toISOString(),
        status: 'open' as const,
        jackpotUsd: 10_000,
        rolloverUsd: 0,
        ticketsCount: 0,
      },
    });
  }

  const ticketsCount = draw.tickets.filter(
    t => t.status !== 'EXPIRED',
  ).length;

  const status =
    draw.isClosed && draw.resolvedAt
      ? 'completed'
      : draw.isClosed
      ? 'closed'
      : 'open';

  return NextResponse.json({
    ok: true,
    draw: {
      id: draw.id,
      date: draw.drawDate.toISOString().slice(0, 10),
      drawDate: draw.drawDate.toISOString(),
      status,
      jackpotUsd:
        typeof draw.jackpotUsd === 'number' ? draw.jackpotUsd : 10_000,
      rolloverUsd: 0, // we don't have this in schema yet – fixed $0
      ticketsCount,
    },
  });
}
