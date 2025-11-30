import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tickets/history?wallet=ADDRESS
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json(
      { ok: false, error: 'Wallet address required' },
      { status: 400 }
    );
  }

  const tickets = await prisma.ticket.findMany({
  where: {
    wallet: {
      address: wallet,
    },
  },
  include: {
    draw: true,
    wallet: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 200,
});

  const history = tickets.map(t => ({
    id: t.id,
    code: t.code,
    status: t.status,
    label: t.label,
    jackpotUsd: t.jackpotUsd,
    walletAddress: t.walletAddress,

    // ✅ SAFE fields
    createdAt: t.createdAt
      ? new Date(t.createdAt).toISOString()
      : null,

    drawDate: t.draw?.drawDate
      ? new Date(t.draw.drawDate).toISOString()
      : null,

    resolvedAt: t.draw?.resolvedAt
      ? new Date(t.draw.resolvedAt).toISOString()
      : null,

    isClosed: t.draw?.isClosed ?? false,
  }));

  return NextResponse.json(
    { ok: true, tickets: history },
    { status: 200 }
  );
}
