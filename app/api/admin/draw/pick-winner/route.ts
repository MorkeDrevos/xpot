// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../../_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // ─────────────────────────────────────────────
  // Find today's draw (using drawDate range)
  // ─────────────────────────────────────────────
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );

  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      tickets: true,
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

  if (!draw.tickets || draw.tickets.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'NO_TICKETS' },
      { status: 400 },
    );
  }

  // ─────────────────────────────────────────────
  // Pick random ticket as winner
  // ─────────────────────────────────────────────
  const winnerTicket =
    draw.tickets[Math.floor(Math.random() * draw.tickets.length)];

  const jackpotUsd = draw.jackpotUsd ?? 0;

  // ─────────────────────────────────────────────
  // Update DB in a single transaction:
  //  - mark winner ticket as WON
  //  - mark all other tickets in this draw as NOT_PICKED
  //  - close the draw, set winnerTicketId, reset payout fields ONLY for today
  // ─────────────────────────────────────────────
  const [updatedDraw, updatedWinner] = await prisma.$transaction([
    prisma.draw.update({
      where: { id: draw.id },
      data: {
        isClosed: true,
        resolvedAt: new Date(),
        winnerTicketId: winnerTicket.id,
        // IMPORTANT: this only touches today's draw;
        // older draws keep their paidAt / payoutTx intact.
        paidAt: null,
        payoutTx: null,
        jackpotUsd, // keep or set jackpotUsd
      },
      include: {
        winnerTicket: {
          include: {
            wallet: true,
          },
        },
      },
    }),

    prisma.ticket.update({
      where: { id: winnerTicket.id },
      data: {
        status: 'WON',
      },
    }),

    // mark all other tickets in this draw as NOT_PICKED
    prisma.ticket.updateMany({
      where: {
        drawId: draw.id,
        id: { not: winnerTicket.id },
      },
      data: {
        status: 'NOT_PICKED',
      },
    }),
  ]).then(([d]) =>
    // first element from $transaction is updated draw;
    // we still want the winner ticket with wallet info
    Promise.all([
      d,
      prisma.ticket.findUnique({
        where: { id: winnerTicket.id },
        include: { wallet: true },
      }),
    ]),
  );

  if (!updatedWinner) {
    return NextResponse.json(
      { ok: false, error: 'WINNER_NOT_FOUND_AFTER_UPDATE' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    winner: {
      drawId: updatedDraw.id,
      ticketId: updatedWinner.id,
      code: updatedWinner.code,
      wallet: updatedWinner.wallet.address,
      jackpotUsd: updatedDraw.jackpotUsd ?? 0,
    },
  });
}
