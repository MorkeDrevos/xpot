// app/api/admin/draw/today/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

// Simple helper to get today's UTC range
function getTodayRange() {
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const start = new Date(`${todayStr}T00:00:00.000Z`);
  const end = new Date(`${todayStr}T23:59:59.999Z`);
  return { start, end };
}

// Map DB ticket statuses to API-friendly ones
const statusMap: Record<string, string> = {
  IN_DRAW: 'in-draw',
  WON: 'won',
  CLAIMED: 'claimed',
  NOT_PICKED: 'not-picked',
  EXPIRED: 'expired',
};

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { start, end } = getTodayRange();

    // 1) Find today's draw + its tickets
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: start, lt: end },
      },
      include: {
        tickets: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_DRAW_TODAY' },
        { status: 200 },
      );
    }

    // 2) Normalize tickets
    const tickets = draw.tickets.map((t) => ({
      id: t.id,
      code: t.code,
      status: statusMap[t.status] ?? 'in-draw',
      createdAt: t.createdAt.toISOString(),
      wallet: t.wallet?.address ?? '',
      // DB no longer has jackpotUsd; keep field for UI but compute/fill here
      jackpotUsd: 0,
    }));

    // 3) Response
    return NextResponse.json(
      {
        ok: true,
        drawId: draw.id,
        drawDate: draw.drawDate.toISOString(),
        tickets,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[/admin/draw/today/tickets] error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
