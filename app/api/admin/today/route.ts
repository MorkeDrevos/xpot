// app/api/admin/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

type DrawStatus = 'open' | 'closed' | 'completed';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today as YYYY-MM-DD (UTC)
    const todayStr = new Date().toISOString().slice(0, 10);
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    // Latest draw *today* (if there are multiple)
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: {
        drawDate: 'desc',
      },
    });

    if (!draw) {
      return NextResponse.json({
        ok: true,
        today: null,
      });
    }

    // Count ONLY active tickets for this draw
    const ticketsCount = await prisma.ticket.count({
      where: {
        drawId: draw.id,
        status: 'IN_DRAW',
      },
    });

    // ClosesAt: use DB value if set; otherwise default to 22:00 Madrid (21:00 UTC)
    let closesAt: string | null = null;
    if (draw.closesAt) {
      closesAt = draw.closesAt.toISOString();
    } else {
      const c = new Date(draw.drawDate);
      c.setUTCHours(21, 0, 0, 0); // 22:00 Madrid in winter
      closesAt = c.toISOString();
    }

    const status: DrawStatus = draw.isClosed ? 'closed' : 'open';

    const today = {
      id: draw.id,
      date: draw.drawDate.toISOString(),
      status,
      jackpotUsd: draw.jackpotUsd ?? 0,
      rolloverUsd: draw.rolloverUsd ?? 0,
      ticketsCount,
      closesAt,
    };

    return NextResponse.json({
      ok: true,
      today,
    });
  } catch (err) {
    console.error('[ADMIN] /today error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LOAD_TODAY' },
      { status: 500 },
    );
  }
}
