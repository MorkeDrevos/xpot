// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TicketStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  // TODO: re-enable admin protection when _auth path is confirmed
  // const auth = requireAdmin(req);
  // if (auth) return auth;

  // Get *some* draw (we only care that it has tickets)
  const draw = await prisma.draw.findFirst({
    include: { tickets: true },
  });

  if (!draw) {
    return NextResponse.json({ ok: false, error: 'NO_DRAW' });
  }

  if (!draw.tickets || draw.tickets.length === 0) {
    return NextResponse.json({ ok: false, error: 'NO_TICKETS' });
  }

  // Pick random ticket
  const winner =
    draw.tickets[Math.floor(Math.random() * draw.tickets.length)];

  // Mark ticket as winner
  await prisma.ticket.update({
    where: { id: winner.id },
    data: { status: TicketStatus.WON },
  });

  return NextResponse.json({
    ok: true,
    winner: {
      ticketId: winner.id,
      code: winner.code,
      // adjust this if your Ticket model uses a different field name
      wallet: (winner as any).walletAddress ?? null,
    },
  });
}
