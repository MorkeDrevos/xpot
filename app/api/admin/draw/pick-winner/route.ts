// app/api/admin/draw/recent-winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../../_auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // All draws that already have a winner
  const draws = await prisma.draw.findMany({
    where: {
      winnerTicketId: { not: null },
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

  const winners = draws
    .filter(d => d.winnerTicket)
    .map(d => ({
      drawId: d.id,
      date: d.drawDate.toISOString(),
      ticketCode: d.winnerTicket!.code,
      walletAddress: d.winnerTicket!.wallet.address,
      jackpotUsd: d.jackpotUsd ?? 0,
      paidOut: !!d.paidAt,
      txUrl: d.payoutTx || null,
    }));

  return NextResponse.json({ ok: true, winners });
}
