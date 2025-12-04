// app/api/admin/reopen-draw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Admin-key protection
  const auth = requireAdmin(req);
  if (auth) return auth;

  // Today (00:00–23:59)
  const todayStr = new Date().toISOString().slice(0, 10);
  const start = new Date(`${todayStr}T00:00:00.000Z`);
  const end = new Date(`${todayStr}T23:59:59.999Z`);

  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: start,
        lte: end,
      },
    },
  });

  if (!draw) {
    return NextResponse.json(
      { ok: false, error: 'NO_TODAY_DRAW' },
      { status: 404 },
    );
  }

  const updated = await prisma.draw.update({
    where: { id: draw.id },
    data: {
      status: 'OPEN',
      isClosed: false,
      resolvedAt: null,
      paidAt: null,
      payoutTx: null,
      winnerTicketId: null,
    },
  });

  return NextResponse.json({
    ok: true,
    drawId: updated.id,
  });
}
