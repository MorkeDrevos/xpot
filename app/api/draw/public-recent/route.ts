// app/api/draw/public-recent/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint: last N completed draws + winners
export async function GET() {
  try {
    const draws = (await prisma.draw.findMany({
      where: {
        winnerTicketId: { not: null },
      },
      orderBy: {
        drawDate: 'desc',
      },
      take: 30, // last 30 draws for the feed
      include: {
        winnerTicket: true, // relation from winnerTicketId -> Ticket
      },
    })) as any[];

    const entries = draws.map(d => ({
      drawId: d.id as string,
      // ISO string – easier for client formatting
      date: (d.drawDate as Date).toISOString(),
      ticketCode: d.winnerTicket?.code ?? '',
      walletAddress: d.winnerTicket?.walletAddress ?? '',
      jackpotUsd: Number(d.jackpotUsd ?? 0),
      // treat undefined as false
      paidOut: Boolean(d.winnerPaidOut),
      txUrl: d.winnerPayoutTxUrl ?? null,
    }));

    return NextResponse.json({ ok: true, entries });
  } catch (err) {
    console.error('[PUBLIC] recent draw feed error:', err);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
