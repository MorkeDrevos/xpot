// app/api/ops/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';
import { ensureActiveDraw } from '@/lib/ensureActiveDraw';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const draw = await ensureActiveDraw(new Date());

    const ticketsCount = await prisma.ticket.count({
      where: { drawId: draw.id },
    });

    return NextResponse.json(
      {
        ok: true,
        today: {
          id: draw.id,
          date: draw.drawDate.toISOString(),
          status: (draw.status as 'open' | 'closed' | 'completed') ?? 'open',
          jackpotUsd: 0,
          rolloverUsd: 0,
          ticketsCount,
          closesAt: draw.closesAt ? draw.closesAt.toISOString() : null,
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'OPS_TODAY_FAILED' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
