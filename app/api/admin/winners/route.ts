// app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Reward is the canonical source of winners (main + bonus)
    const rewards = await prisma.reward.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        draw: true,
        ticket: {
          include: {
            wallet: true,
            user: true, // X identity
          },
        },
      },
    });

    const winners = rewards.map((reward) => {
      const draw = reward.draw;
      const ticket = reward.ticket;

      // Decide if this is the main daily XPOT or a bonus pot
      const isMain =
        reward.label === "Today's XPOT" ||
        reward.label === 'Today’s XPOT' ||
        reward.label === 'Main jackpot';

      return {
        id: reward.id,
        kind: (isMain ? 'main' : 'bonus') as const,
        label: reward.label,
        drawId: reward.drawId,
        date: draw.drawDate.toISOString(),
        ticketCode: ticket.code,
        walletAddress: ticket.wallet?.address ?? '',
        // "Jackpot size" – use draw.jackpotUsd if we have it,
        // otherwise fall back to XPOT amount for safety.
        jackpotUsd: draw.jackpotUsd ?? reward.payoutXpot,
        // XPOT amount actually paid out
        payoutUsd: reward.payoutXpot, // still named payoutUsd in UI type, but it’s XPOT
        isPaidOut: reward.isPaidOut,
        txUrl: reward.txUrl ?? null,
        xHandle: ticket.user?.xHandle ?? null,
        xAvatarUrl: ticket.user?.xAvatarUrl ?? null,
      };
    });

    return NextResponse.json({
      ok: true,
      winners: winners.slice(0, 30),
    });
  } catch (err) {
    console.error('[ADMIN] /winners error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LOAD_WINNERS' },
      { status: 500 },
    );
  }
}
