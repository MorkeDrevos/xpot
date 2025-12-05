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

  let todaySummary: any = null;

  if (todayDraw) {
    const ticketsCount = await prisma.ticket.count({
      where: { drawId: todayDraw.id },
    });

    // Derive status from fields we actually have
    const status =
      todayDraw.resolvedAt
        ? 'completed'
        : todayDraw.isClosed
          ? 'closed'
          : 'open';

    // Compute closesAt from drawDate (end of that UTC day)
    const todayStr = todayDraw.drawDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const closesAt = new Date(`${todayStr}T23:59:59.000Z`);

    todaySummary = {
      id: todayDraw.id,
      date: todayDraw.drawDate,          // you can .toISOString() if you prefer string
      status,
      jackpotUsd: todayDraw.jackpotUsd ?? 0,
      rolloverUsd: 0,
      ticketsCount,
      closesAt: closesAt.toISOString(), // matches what admin page expects
    };
  }

  return NextResponse.json({
    ok: true,
    today: todaySummary,
  });
}
