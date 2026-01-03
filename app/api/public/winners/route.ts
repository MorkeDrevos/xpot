// app/api/public/winners/latest/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DAILY_XPOT = 1_000_000;

export async function GET() {
  try {
    const w = await prisma.winner.findFirst({
      orderBy: { date: 'desc' },
      include: {
        draw: true,
        ticket: {
          include: {
            wallet: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!w) {
      return NextResponse.json(
        { ok: true, winner: null },
        { status: 200 }
      );
    }

    const user = w.ticket.wallet.user;

    return NextResponse.json(
      {
        ok: true,
        winner: {
          id: w.id,
          drawDate: w.draw.drawDate.toISOString(),
          wallet: w.walletAddress,
          amount: DAILY_XPOT, // UI stability
          handle: user?.xHandle ?? null,
          name: user?.xName ?? null,
          avatarUrl: user?.xAvatarUrl ?? null,
          txUrl: w.txUrl ?? null,
          isPaidOut: w.isPaidOut,
          jackpotUsd: Number(w.jackpotUsd ?? 0),
          payoutUsd: Number(w.payoutUsd ?? 0),
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('GET /api/public/winners/latest failed', err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
