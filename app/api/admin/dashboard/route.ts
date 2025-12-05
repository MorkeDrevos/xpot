// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

// Get the current "today" window in Europe/Madrid
function getMadridDayRange(base: Date = new Date()) {
  const madridNow = new Date(
    base.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }),
  );

  const start = new Date(madridNow);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

// 22:00 Madrid close time for a given day
function getMadridCloseTime(startOfDay: Date) {
  const close = new Date(startOfDay);
  close.setHours(22, 0, 0, 0);
  return close;
}

export async function GET(req: NextRequest) {
  // Admin auth
  const auth = requireAdmin(req);
  if (auth) return auth;

  const { start, end } = getMadridDayRange();

  // Find today’s draw (by drawDate in Madrid day window)
  const todayDraw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: start,
        lt: end,
      },
    },
    include: {
      tickets: true,
      rewards: true,
    },
  });

  let todaySummary: {
    id: string;
    date: string;
    status: 'open' | 'closed' | 'completed';
    jackpotUsd: number | null;
    rolloverUsd: number; // placeholder for future rollover logic
    ticketsCount: number;
    closesAt: string | null;
  } | null = null;

  if (todayDraw) {
    const status: 'open' | 'closed' | 'completed' = todayDraw.resolvedAt
      ? 'completed'
      : todayDraw.isClosed
      ? 'closed'
      : 'open';

    const madridStartOfDay = new Date(
      todayDraw.drawDate.toLocaleString('en-US', {
        timeZone: 'Europe/Madrid',
      }),
    );
    madridStartOfDay.setHours(0, 0, 0, 0);
    const closesAt = getMadridCloseTime(madridStartOfDay);

    todaySummary = {
      id: todayDraw.id,
      date: todayDraw.drawDate.toISOString(),
      status,
      jackpotUsd:
        typeof todayDraw.jackpotUsd === 'number'
          ? todayDraw.jackpotUsd
          : null,
      // We don’t have real rollover logic yet – keep 0 for now.
      rolloverUsd: 0,
      ticketsCount: todayDraw.tickets.length,
      closesAt: closesAt.toISOString(),
    };
  }

  return NextResponse.json({
    ok: true,
    today: todaySummary,
  });
}
