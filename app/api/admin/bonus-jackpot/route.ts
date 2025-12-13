// app/api/admin/bonus-jackpot/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const yyyyMmDd = new Date().toISOString().slice(0, 10);
  const startOfDay = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  const endOfDay = new Date(`${yyyyMmDd}T23:59:59.999Z`);

  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: { tickets: true },
  });

  if (!draw) {
    return NextResponse.json({ ok: false, error: 'NO_DRAW_TODAY' }, { status: 400 });
  }

  if (!draw.tickets.length) {
    return NextResponse.json({ ok: false, error: 'NO_TICKETS_TODAY' }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    drawId: draw.id,
    date: draw.drawDate.toISOString(),
    status: draw.status,
    ticketsCount: draw.tickets.length,
  });
}
