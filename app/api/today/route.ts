// app/api/admin/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/admin/_auth';
import { prisma } from '@/lib/prisma';
import { ensureTodayDraw } from '@/lib/ensureTodayDraw';

export const dynamic = 'force-dynamic';

type DrawStatus = 'open' | 'closed' | 'completed';

function statusFromDraw(draw: {
  isClosed: boolean;
  resolvedAt: Date | null;
}): DrawStatus {
  if (draw.resolvedAt) return 'completed';
  if (draw.isClosed) return 'closed';
  return 'open';
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // 1) Make sure we have a draw for today (may create one)
    const todayDraw = await ensureTodayDraw();

    if (!todayDraw) {
      // There is a previous draw still running – don’t auto-create
      return NextResponse.json({
        ok: true,
        today: null,
      });
    }

    // 2) Count today’s tickets
    const ticketsCount = await prisma.ticket.count({
      where: { drawId: todayDraw.id },
    });

    // 3) Compute closesAt = end of today (UTC)
    const todayStr = todayDraw.drawDate.toISOString().slice(0, 10);
    const closesAt = new Date(`${todayStr}T23:59:59.000Z`);

    // 4) Build payload in the exact shape AdminPage expects
    const todayPayload = {
      id: todayDraw.id,
      date: todayDraw.drawDate.toISOString(),
      status: statusFromDraw(todayDraw),
      jackpotUsd: todayDraw.jackpotUsd ?? 0,
      rolloverUsd: 0, // you can later compute real rollover here
      ticketsCount,
      closesAt: closesAt.toISOString(),
    };

    return NextResponse.json({
      ok: true,
      today: todayPayload,
    });
  } catch (err: any) {
    console.error('[XPOT] /api/admin/today error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
