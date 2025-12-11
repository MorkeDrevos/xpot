// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  // Admin guard
  await requireAdmin(req);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Simple UTC day window (good enough for today stats)
  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  // Find today's draw by drawDate, including related records
  const todayDraw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      tickets: true,
      winners: true,
      bonusDrops: true,
    },
  });

  if (!todayDraw) {
    return NextResponse.json(
      {
        ok: true,
        today: null,
      },
      { status: 200 },
    );
  }

  const todaySummary = {
    id: todayDraw.id,
    date: todayDraw.drawDate.toISOString(),
    status: todayDraw.status,
    ticketsCount: todayDraw.tickets.length,
    winnersCount: todayDraw.winners.length,
    bonusDropsCount: todayDraw.bonusDrops.length,
  };

  return NextResponse.json(
    {
      ok: true,
      today: todaySummary,
    },
    { status: 200 },
  );
}
