// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/admin/_auth';
import { prisma } from '@/lib/prisma';
import { ensureTodayDraw } from '@/lib/ensureTodayDraw';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // 🔑 Make sure today’s draw exists (if it’s allowed to auto-create)
  const todayDraw = await ensureTodayDraw();

  // you probably already had some logic here – keep it,
  // just swap where you were doing prisma.draw.findFirst for today
  // and use `todayDraw` instead.
  // Example:
  let todaySummary = null;

  if (todayDraw) {
    const ticketsCount = await prisma.ticket.count({
      where: { drawId: todayDraw.id },
    });

    todaySummary = {
      id: todayDraw.id,
      date: todayDraw.drawDate,
      status: todayDraw.resolvedAt
  ? 'completed'
  : todayDraw.isClosed
    ? 'closed'
    : 'open',
      jackpotUsd: todayDraw.jackpotUsd,
      rolloverUsd: 0,
      ticketsCount,
      closesAt: todayDraw.closesAt,
    };
  }

  return NextResponse.json({
    ok: true,
    today: todaySummary,
    // ...whatever else you return
  });
}
