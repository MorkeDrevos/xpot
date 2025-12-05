// app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Main daily draw winners
    const mainDraws = await prisma.draw.findMany({
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
            user: true, // X identity
          },
        },
      },
    });

    // Bonus / hype jackpots (Reward is canonical source)
    const bonusRewards = await prisma.reward.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 40,
      include: {
        ticket: {
          include: {
            wallet: true,
            user: true, // X identity
          },
        },
        draw: true,
      },
    });

    const mainWinners = mainDraws.map((draw) => ({
      id: draw.id,
      kind: 'main' as const,
      label: 'Main jackpot',
      drawId: draw.id,
      date: draw.drawDate.toISOString(),
      ticketCode: draw.winnerTicket?.code ?? '',
      walletAddress: draw.winnerTicket?.wallet?.address ?? '',
      jackpotUsd: draw.jackpotUsd ?? 0,
      // treated as XPOT amount in the UI
      payoutUsd: draw.jackpotUsd ?? 0,
      isPaidOut: Boolean(draw.paidAt),
      txUrl: draw.payoutTx ?? null,
      xHandle: draw.winnerTicket?.user?.xHandle ?? null,
      xAvatarUrl: draw.winnerTicket?.user?.xAvatarUrl ?? null,
    }));

    const bonusWinners = bonusRewards.map((reward) => ({
      id: reward.id,
      kind: 'bonus' as const,
      label: reward.label,
      drawId: reward.drawId,
      date: reward.createdAt.toISOString(),
      ticketCode: reward.ticket.code,
      walletAddress: reward.ticket.wallet.address,
      // XPOT amount from Reward.payoutXpot (DB column "amountUsd")
      jackpotUsd: reward.payoutXpot,
      payoutUsd: reward.payoutXpot,
      isPaidOut: reward.isPaidOut,
      txUrl: reward.txUrl ?? null,
      xHandle: reward.ticket.user?.xHandle ?? null,
      xAvatarUrl: reward.ticket.user?.xAvatarUrl ?? null,
    }));

    // Merge & sort newest first
    const winners = [...mainWinners, ...bonusWinners]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);

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
