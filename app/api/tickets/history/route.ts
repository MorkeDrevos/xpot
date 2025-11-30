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

  const history = tickets.map(t => {
  // Derive status from draw
  const status =
    !t.draw?.isClosed
      ? 'in-draw'
      : t.draw?.winnerTicketId === t.id
        ? 'won'
        : 'expired';

  return {
    id: t.id,
    code: t.code,
    status, // computed above
    label: "Today’s main jackpot • $10,000",
    jackpotUsd: 10000,
    createdAt: t.createdAt.toISOString(),
    walletAddress: t.wallet.address,
    drawDate: t.draw?.drawDate?.toISOString() ?? null,
  };
});
