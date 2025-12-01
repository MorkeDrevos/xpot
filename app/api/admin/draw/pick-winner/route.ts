// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TicketStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  // TODO: re-enable admin protection when _auth path is confirmed
  // const auth = requireAdmin(req);
  // if (auth) return auth;

  // Find today's open draw (adjust time logic if needed)
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      isClosed: false,
    },
    include: { tickets: true },
  });

  if (!draw) {
    return NextResponse.json({ ok: false, error: 'NO_OPEN_DRAW' });
  }

  const eligibleTickets = draw.tickets.filter(
    (t) => t.status === TicketStatus.IN_DRAW,
  );

  if (eligibleTickets.length === 0) {
    return NextResponse.json({ ok: false, error: 'NO_ELIGIBLE_TICKETS' });
  }

  // Pick random ticket from eligible ones
  const winner =
    eligibleTickets[Math.floor(Math.random() * eligibleTickets.length)];

  // Finalise draw in a single transaction:
  // - mark winner as WON
  // - mark all other IN_DRAW tickets as NOT_PICKED
  // - close draw + store winnerTicketId + resolvedAt
  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: winner.id },
      data: { status: TicketStatus.WON },
    }),
    prisma.ticket.updateMany({
      where: {
        drawId: draw.id,
        id: { not: winner.id },
        status: TicketStatus.IN_DRAW,
      },
      data: { status: TicketStatus.NOT_PICKED },
    }),
    prisma.draw.update({
      where: { id: draw.id },
      data: {
        isClosed: true,
        resolvedAt: new Date(),
        winnerTicketId: winner.id,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    drawId: draw.id,
    winner: {
      ticketId: winner.id,
      code: winner.code,
      walletId: winner.walletId,
      status: TicketStatus.WON,
    },
  });
}
