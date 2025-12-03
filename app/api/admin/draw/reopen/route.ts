// app/api/admin/draw/reopen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../../_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // Find latest draw (Today’s XPOT round)
  const draw = await prisma.draw.findFirst({
    orderBy: { drawDate: 'desc' },
    include: { winnerTicket: true },
  });

  if (!draw) {
    return NextResponse.json(
      { ok: false, error: 'NO_DRAW_FOUND' },
      { status: 404 },
    );
  }

  // Re-open the draw and clear winner info
  await prisma.$transaction([
    prisma.draw.update({
      where: { id: draw.id },
      data: {
        isClosed: false,
        resolvedAt: null,
        winnerTicketId: null,
      },
    }),
    prisma.ticket.updateMany({
      where: { drawId: draw.id },
      data: { status: 'IN_DRAW' as any },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    message: 'DRAW_REOPENED',
    drawId: draw.id,
  });
}
