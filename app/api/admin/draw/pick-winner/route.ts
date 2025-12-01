import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // Get today’s draw
  const today = new Date().toISOString().slice(0, 10);

  const draw = await prisma.draw.findFirst({
    where: { date: today },
    include: { tickets: true },
  });

  if (!draw) {
    return NextResponse.json({ ok: false, error: 'NO_DRAW' });
  }

  if (draw.status !== 'open') {
    return NextResponse.json({ ok: false, error: 'DRAW_NOT_OPEN' });
  }

  if (draw.tickets.length === 0) {
    return NextResponse.json({ ok: false, error: 'NO_TICKETS' });
  }

  // Pick random ticket
  const winner =
    draw.tickets[Math.floor(Math.random() * draw.tickets.length)];

  // Save winner + close draw
  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: winner.id },
      data: { status: 'won' },
    }),
    prisma.draw.update({
      where: { id: draw.id },
      data: { status: 'completed' },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    winner: {
      ticketId: winner.id,
      code: winner.code,
      wallet: winner.walletAddress,
    },
  });
}
