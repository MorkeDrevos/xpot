¡// app/api/draw/public-recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    // Load recent MAIN winners from Winner table
    const winners = await prisma.winner.findMany({
      where: {
        kind: 'MAIN',
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
      include: {
        draw: true,
        ticket: {
          include: {
            wallet: true,
          },
        },
      },
    });

    const payload = winners.map((w) => {
      const handleWallet =
        w.ticket.wallet?.address || w.walletAddress || '';

      // basic mask for public API
      const maskedWallet =
        handleWallet.length > 10
          ? `${handleWallet.slice(0, 4)}...${handleWallet.slice(-4)}`
          : handleWallet;

      return {
        id: w.id,
        date: w.date.toISOString(),
        ticketCode: w.ticketCode,
        walletAddress: maskedWallet,
        jackpotUsd: w.jackpotUsd,
        payoutUsd: w.payoutUsd,
        kind: w.kind ?? 'MAIN',
        label: w.label ?? 'XPOT winner',
        drawDate: w.draw.drawDate.toISOString(),
        txUrl: w.txUrl || null,
        isPaidOut: w.isPaidOut,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        winners: payload,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /draw/public-recent error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
