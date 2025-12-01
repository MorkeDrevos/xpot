// app/api/admin/draw/reopen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, TicketStatus } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  // Re-open the most recent draw
  const draw = await prisma.draw.findFirst({
    orderBy: { drawDate: 'desc' },
  });

  if (!draw) {
    return NextResponse.json(
      { ok: false, error: 'NO_DRAW' },
      { status: 404 },
    );
  }

  const updates: any = {
    isClosed: false,
    resolvedAt: null,
  };

  // If there was a winner ticket, reset it back into the pool
  if (draw.winnerTicketId) {
    updates.winnerTicketId = null;

    try {
      await prisma.ticket.update({
        where: { id: draw.winnerTicketId },
        data: { status: TicketStatus.IN_DRAW },
      });
    } catch (err) {
      console.error(
        '[ADMIN] failed to reset winner ticket status:',
        err,
      );
    }
  }

  const updated = await prisma.draw.update({
    where: { id: draw.id },
    data: updates,
  });

  return NextResponse.json({ ok: true, drawId: updated.id });
}
