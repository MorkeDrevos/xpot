// app/api/admin/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/admin/_auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type DrawStatus = 'open' | 'closed' | 'completed';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // Today as YYYY-MM-DD (UTC)
  const todayStr = new Date().toISOString().slice(0, 10);
  const start = new Date(`${todayStr}T00:00:00.000Z`);
  const end = new Date(`${todayStr}T23:59:59.999Z`);

  // 1) Find today’s latest draw (by drawDate)
  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: start,
        lt: end,
      },
    },
    orderBy: {
      drawDate: 'desc',
    },
  });

  // No draw today
  if (!draw) {
    return NextResponse.json({
      ok: true,
      today: null,
    });
  }

  // 2) Count active tickets in the pool (IN_DRAW)
  const ticketsCount = await prisma.ticket.count({
    where: {
      drawId: draw.id,
      status: 'IN_DRAW',
    },
  });

  // 3) Map DB → API shape the admin page expects
  const status: DrawStatus = draw.isClosed ? 'closed' : 'open';

  return NextResponse.json({
    ok: true,
    today: {
      id: draw.id,
      date: draw.drawDate,
      status,
      jackpotUsd: draw.jackpotUsd ?? 0,
      rolloverUsd: draw.rolloverUsd ?? 0,
      ticketsCount,
      closesAt: draw.closesAt,
    },
  });
}
