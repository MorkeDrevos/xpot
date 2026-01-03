// app/public/winners/latest/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DAILY_XPOT = 1_000_000;

type LatestWinnerPayload = {
  ok: true;
  winner: {
    id: string;
    drawDate: string | null;
    wallet: string | null;

    // homepage expects this key
    amount: number;

    handle: string | null;
    name: string | null;
    avatarUrl: string | null;

    txUrl: string | null;
    isPaidOut: boolean;

    jackpotUsd: number;
    payoutUsd: number;
  } | null;
};

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
      return NextResponse.json({ ok: true, winner: null }, { status: 200 });
    }

    const user = w.ticket?.wallet?.user ?? null;

    return NextResponse.json(
      {
        ok: true,
        winner: {
          id: w.id,
          drawDate:
            w.draw?.drawDate instanceof Date
              ? w.draw.drawDate.toISOString()
              : null,
          wallet: w.walletAddress ?? null,

          // IMPORTANT: Winner model has NO amount field
          amount: DAILY_XPOT,

          // Prisma User fields (confirmed from your schema)
          handle: user?.xHandle ?? null,
          name: user?.xName ?? null,
          avatarUrl: user?.xAvatarUrl ?? null,

          txUrl: w.txUrl ?? null,
          isPaidOut: w.isPaidOut,

          jackpotUsd: Number(w.jackpotUsd ?? 0),
          payoutUsd: Number(w.payoutUsd ?? 0),
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('GET /public/winners/latest error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
