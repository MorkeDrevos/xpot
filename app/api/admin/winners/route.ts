import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '../_auth';

// GET: list recent winners
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

// POST: mark winner as paid + store tx url
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const body = await req.json();
  const { drawId, txUrl } = body;

  if (!drawId) {
    return NextResponse.json(
      { ok: false, error: 'Missing drawId' },
      { status: 400 }
    );
  }

  await prisma.winningTicket.update({
    where: { drawId },
    data: {
      paidOut: true,
      paidOutAt: new Date(),
      txUrl: txUrl || null,
    },
  });

  return NextResponse.json({ ok: true });
}
