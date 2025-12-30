// app/api/admin/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';
import { ensureActiveDraw } from '@/lib/ensureActiveDraw';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // 1) Make sure today's draw exists (creates if missing)
    const draw = await ensureActiveDraw(new Date());

    // 2) Count tickets for this draw
    const ticketsCount = await prisma.ticket.count({
      where: { drawId: draw.id },
    });

    // 3) Payload for admin dashboard
    const payload = {
      id: draw.id,
      date: draw.drawDate.toISOString(),
      status: (draw.status as 'open' | 'closed' | 'completed') ?? 'open',
      jackpotUsd: 0,
      rolloverUsd: 0,
      ticketsCount,
      closesAt: draw.closesAt,
    };

    return NextResponse.json({ ok: true, today: payload }, { status: 200 });
  } catch (err: any) {
    console.error('[XPOT] /admin/today error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
