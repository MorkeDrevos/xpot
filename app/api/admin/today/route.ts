// app/api/admin/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

type DrawStatus = 'open' | 'closed' | 'completed';

// Helper: today’s UTC range (treated as Madrid “day” in the app)
function getTodayRange() {
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const start = new Date(`${todayStr}T00:00:00.000Z`);
  const end = new Date(`${todayStr}T23:59:59.999Z`);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { start, end } = getTodayRange();

    // 1) Load today’s draw by drawDate
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: start, lt: end },
      },
      include: {
        tickets: true,
        winners: true,
        bonusDrops: true,
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_DRAW_TODAY' },
        { status: 404 },
      );
    }

    // 2) Normalize status into our DrawStatus union
    let status: DrawStatus;
    switch (draw.status) {
      case 'closed':
        status = 'closed';
        break;
      case 'completed':
        status = 'completed';
        break;
      default:
        status = 'open';
        break;
    }

    // 3) Build payload for admin dashboard
    const payload = {
      id: draw.id,
      date: draw.drawDate.toISOString(),
      status,
      jackpotUsd: 0, // you can wire real USD later if needed
      rolloverUsd: 0,
      ticketsCount: draw.tickets.length,
      closesAt: draw.closesAt ? draw.closesAt.toISOString() : null,
    };

    return NextResponse.json(
      {
        ok: true,
        today: payload,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /admin/today error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
