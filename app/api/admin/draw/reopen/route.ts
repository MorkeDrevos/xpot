import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/_auth';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

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

  // Reset ticket if one existed
  if (draw.winnerTicket) {
    await prisma.ticket.update({
      where: { id: draw.winnerTicket.id },
      data: { status: 'IN_DRAW' },
    });
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
