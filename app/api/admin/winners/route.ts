// app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // We use Draw as the source of truth for winners
    const draws = await prisma.draw.findMany({
      where: {
        winnerTicketId: { not: null },
      },
      orderBy: { drawDate: 'desc' },
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
      .filter(d => d.winnerTicketId && d.winnerTicket)
      .map(d => ({
        id: d.id,
        drawId: d.id,
        date: d.drawDate.toISOString(),
        ticketCode: d.winnerTicket!.code,
        walletAddress: d.winnerTicket!.wallet.address,
        jackpotUsd: d.jackpotUsd ?? 0,
        payoutUsd: d.jackpotUsd ?? 0, // if you later store separate payout, adjust here
        isPaidOut: Boolean(d.paidAt),
        txUrl: d.payoutTx ?? null,
      }));

    return NextResponse.json({
      ok: true,
      winners,
    });
  } catch (err) {
    console.error('[ADMIN] /winners error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LOAD_WINNERS' },
      { status: 500 },
    );
  }
}
