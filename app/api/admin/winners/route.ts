import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '../../_auth';

// List recent winners  (used by the "Recent winners" card)
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const winners = await prisma.winningTicket.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      draw: true,
      ticket: true,
    },
  });

  return NextResponse.json({ ok: true, winners });
}

// Mark a specific winner as paid
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const { winnerId } = await req.json();
  if (!winnerId) {
    return NextResponse.json(
      { ok: false, error: 'Missing winnerId' },
      { status: 400 },
    );
  }

  await prisma.winningTicket.update({
    where: { id: winnerId },
    data: {
      paidOut: true,
      paidOutAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
