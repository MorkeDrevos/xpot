// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../../_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // Use the latest OPEN draw as "Today’s XPOT"
  const draw = await prisma.draw.findFirst({
    where: { isClosed: false },
    orderBy: { drawDate: 'desc' },
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

  // Random entry as XPOT selection
  const winnerTicket =
    draw.tickets[Math.floor(Math.random() * draw.tickets.length)];
  const jackpotUsd = draw.jackpotUsd ?? 0;

  // Update everything in one transaction:
  // - mark selected ticket as WON
  // - mark other tickets as NOT_PICKED
  // - close draw & set winnerTicketId
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
