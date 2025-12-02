// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '../../_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // Find today's draw
  const today = new Date().toISOString().slice(0, 10);

  const draw = await prisma.draw.findFirst({
    where: { date: today },
    include: {
      tickets: true,
    },
  });

  if (!draw) {
    return NextResponse.json({ ok: false, error: 'NO_DRAW' });
  }

  if (draw.status !== 'open') {
    return NextResponse.json({ ok: false, error: 'DRAW_NOT_OPEN' });
  }

  if (!draw.tickets || draw.tickets.length === 0) {
    return NextResponse.json({ ok: false, error: 'NO_TICKETS' });
  }

  // Randomly pick a ticket from today's pool
  const winnerTicket =
    draw.tickets[Math.floor(Math.random() * draw.tickets.length)];

  // Upsert the winningTicket row for THIS draw only.
  // IMPORTANT: this does NOT touch older winners, so their paidOut/txUrl stay as-is.
  const winning = await prisma.winningTicket.upsert({
    where: { drawId: draw.id }, // one winner row per draw
    create: {
      drawId: draw.id,
      ticketId: winnerTicket.id,
      jackpotUsd: draw.jackpotUsd ?? 0,
      paidOut: false,
      txUrl: null,
    },
    update: {
      ticketId: winnerTicket.id,
      jackpotUsd: draw.jackpotUsd ?? 0,
      // reset ONLY today’s winner status/tx if you repick
      paidOut: false,
      txUrl: null,
    },
    include: {
      ticket: true,
    },
  });

  // Lock the draw after picking
  await prisma.draw.update({
    where: { id: draw.id },
    data: { status: 'completed' },
  });

  return NextResponse.json({
    ok: true,
    winner: {
      id: winning.id,
      drawId: winning.drawId,
      ticketId: winning.ticketId,
      code: winning.ticket.code,
      wallet: winning.ticket.walletAddress,
      jackpotUsd: winning.jackpotUsd,
      paidOut: winning.paidOut,
      txUrl: winning.txUrl,
    },
  });
}
