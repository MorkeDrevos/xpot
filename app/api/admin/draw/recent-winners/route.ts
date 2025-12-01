// app/api/admin/draw/recent-winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorized(req: NextRequest): boolean {
  const header =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!header || header !== process.env.XPOT_ADMIN_TOKEN) {
    return false;
  }

  return true;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  // Latest completed draws that have a winner
  const draws = await prisma.draw.findMany({
    where: {
      isClosed: true,
      winnerTicketId: { not: null },
    },
    orderBy: {
      drawDate: 'desc',
    },
    take: 10,
    include: {
      winnerTicket: {
        include: {
          wallet: true, // <- so we can read wallet.address
        },
      },
    },
  });

  // Cast to any so TS stops whining about jackpotUsd / payoutTx, etc.
  const winners = (draws as any[]).map(draw => ({
    drawId: draw.id,
    date: draw.drawDate.toISOString(),
    ticketCode: draw.winnerTicket?.code ?? 'UNKNOWN',
    walletAddress: draw.winnerTicket?.wallet?.address ?? 'UNKNOWN',
    jackpotUsd: Number(draw.jackpotUsd),
    paidOut: !!draw.paidAt,
    txUrl: draw.payoutTx || null,
  }));

  return NextResponse.json({
    ok: true,
    winners,
  });
}
