import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // Get latest draw (schema-agnostic)
  const draw = await prisma.draw.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { tickets: true },
  });

  if (!draw) {
    return NextResponse.json({ ok: false, error: 'NO_DRAW' });
  }

  if (draw.tickets.length === 0) {
    return NextResponse.json({ ok: false, error: 'NO_TICKETS' });
  }

  // Pick random ticket
  const winner =
    draw.tickets[Math.floor(Math.random() * draw.tickets.length)];

  // Save winner ONLY (do NOT touch draw yet)
  await prisma.ticket.update({
    where: { id: winner.id },
    data: { status: 'won' },
  });

  return NextResponse.json({
    ok: true,
    winner: {
      ticketId: winner.id,
      code: winner.code,
      wallet: winner.walletAddress,
    },
  });
}
