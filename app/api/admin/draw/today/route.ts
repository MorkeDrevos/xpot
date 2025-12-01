// app/api/admin/draw/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorized(req: NextRequest): boolean {
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

  // Figure out "today" in UTC
  const now = new Date();
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  // Get today's draw (if any), plus ticket count
  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      _count: {
        select: {
          tickets: true,
        },
      },
    },
    orderBy: {
      drawDate: 'desc',
    },
  });

  if (!draw) {
    // No draw created for today yet
    return NextResponse.json({
      ok: true,
      draw: null,
    });
  }

  const ticketsCount = draw._count?.tickets ?? 0;

  // Map DB flags -> UI status
  const status: 'open' | 'closed' | 'completed' =
    draw.isClosed
      ? draw.resolvedAt
        ? 'completed'
        : 'closed'
      : 'open';

  return NextResponse.json({
    ok: true,
    draw: {
      id: draw.id,
      // short date string, eg "2025-12-01"
      date: draw.drawDate.toISOString().slice(0, 10),
      // full ISO string if you ever need it
      drawDate: draw.drawDate.toISOString(),
      status,
      jackpotUsd: Number(draw.jackpotUsd ?? 0),
      // You don't have this column in Prisma – keep it 0 for now
      rolloverUsd: 0,
      ticketsCount,
    },
  });
}
