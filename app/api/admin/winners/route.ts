// app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const draws = await prisma.draw.findMany({
    where: {
      winnerTicketId: {
        not: null,
      },
    },
    orderBy: {
      drawDate: 'desc',
    },
    take: 20,
    include: {
      winnerTicket: {
        include: {
          wallet: true,
        },
      },
    },
  });

  const winners = draws.map(d => ({
    id: d.id,
    drawId: d.id,
    date: d.drawDate.toISOString(),
    ticketCode: d.winnerTicket?.code ?? '',
    walletAddress: d.winnerTicket?.wallet?.address ?? '',
    jackpotUsd: d.jackpotUsd ?? 0,
    // If you later store a separate payoutUsd, map it here.
    payoutUsd: d.jackpotUsd ?? 0,
    isPaidOut: Boolean(d.paidAt),
    txUrl: d.payoutTx ?? null,
  }));

  return NextResponse.json({
    ok: true,
    winners,
  });
}
