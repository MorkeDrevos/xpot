// app/api/admin/draw/recent-winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '/vercel/path0/lib/prisma';

function isAuthorized(req: NextRequest): boolean {
  const header =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!header || header !== process.env.XPOT_ADMIN_TOKEN) return false;
  return true;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  // Latest completed XPOT rounds that have a selected ticket
  const draws = await prisma.draw.findMany({
    where: {
      winnerTicketId: { not: null },
    },
    orderBy: {
      drawDate: 'desc',
    },
    take: 10,
    include: {
      winnerTicket: {
        include: {
          wallet: true,
        },
      },
    },
  });

  const winners = draws.map(draw => ({
    drawId: draw.id,
    date: draw.drawDate.toISOString(),
    ticketCode: draw.winnerTicket?.code ?? 'UNKNOWN',
    walletAddress: draw.winnerTicket?.wallet?.address ?? 'UNKNOWN',
    jackpotUsd: Number(draw.jackpotUsd ?? 10_000),
    paidOut: !!draw.paidAt,
    txUrl: draw.payoutTx || null,
  }));

  return NextResponse.json({
    ok: true,
    winners,
  });
}
