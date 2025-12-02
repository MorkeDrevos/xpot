// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../../_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // Find today's draw by date
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      tickets: {
        include: { wallet: true },
      },
    },
  });

  if (!draw) {
    return NextResponse.json({ ok: false, error: 'NO_DRAW' }, { status: 400 });
  }

  if (draw.isClosed) {
    return NextResponse.json(
      { ok: false, error: 'DRAW_NOT_OPEN' },
      { status: 400 },
    );
  }

  if (!draw.tickets.length) {
    return NextResponse.json(
      { ok: false, error: 'NO_TICKETS' },
      { status: 400 },
    );
  }

  // Random ticket as winner
  const winnerTicket =
    draw.tickets[Math.floor(Math.random() * draw.tickets.length)];
  const jackpotUsd = draw.jackpotUsd ?? 0;

  // Update everything in one transaction:
  // - mark winner as WON
  // - mark other tickets as NOT_PICKED
  // - close today's draw & set winnerTicketId
  // IMPORTANT: we do NOT touch paidAt / payoutTx here
  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: winnerTicket.id },
      data: { status: 'WON' as any },
    }),
    prisma.ticket.updateMany({
      where: {
        drawId: draw.id,
        id: { not: winnerTicket.id },
      },
      data: { status: 'NOT_PICKED' as any },
    }),
    prisma.draw.update({
      where: { id: draw.id },
      data: {
        isClosed: true,
        resolvedAt: new Date(),
        winnerTicketId: winnerTicket.id,
        jackpotUsd,
        // DO NOT reset paidAt / payoutTx here
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    winner: {
      drawId: draw.id,
      ticketId: winnerTicket.id,
      code: winnerTicket.code,
      wallet: winnerTicket.wallet.address,
      jackpotUsd,
    },
  });
}
