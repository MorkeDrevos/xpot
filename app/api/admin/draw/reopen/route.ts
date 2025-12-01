import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(_req: NextRequest) {
  // Find latest draw
  const draw = await prisma.draw.findFirst({
    orderBy: { drawDate: 'desc' },
    include: { winnerTicket: true },
  });

  if (!draw) {
    return NextResponse.json(
      { ok: false, error: 'NO_DRAW_FOUND' },
      { status: 404 }
    );
  }

  const updates: any = {
    isClosed: false,
    resolvedAt: null,
    winnerTicketId: null,
  };

  // If there was a winner ticket, reset it back into the pool
  if (draw.winnerTicket) {
    try {
      await prisma.ticket.update({
        where: { id: draw.winnerTicket.id },
        data: { status: 'IN_DRAW' }, // plain string is fine
      });
    } catch (err) {
      console.error('[ADMIN] failed to reset winner ticket status:', err);
    }
  }

  await prisma.draw.update({
    where: { id: draw.id },
    data: updates,
  });

  return NextResponse.json({
    ok: true,
    message: 'DRAW_REOPENED',
    drawId: draw.id,
  });
}
