// app/api/public/winners/latest/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Keep homepage stable (Winner model does NOT have "amount" in your schema)
const DAILY_XPOT = 1_000_000;

type LatestWinnerPayload = {
  ok: true;
  winner: {
    id: string;
    drawDate: string | null; // ISO
    wallet: string | null;

    amountXpot: number;

    handle: string | null;
    name: string | null;
    avatarUrl: string | null;

    txUrl: string | null;
    isPaidOut: boolean;

    jackpotUsd: number;
    payoutUsd: number;
    kind: 'MAIN' | 'BONUS' | null;
    label: string | null;
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
      const payload: LatestWinnerPayload = { ok: true, winner: null };
      return NextResponse.json(payload, { status: 200 });
    }

    const user = w.ticket?.wallet?.user;

    const payload: LatestWinnerPayload = {
      ok: true,
      winner: {
        id: w.id,
        drawDate: w.draw?.drawDate ? w.draw.drawDate.toISOString() : null,
        wallet: w.walletAddress ?? w.ticket?.walletAddress ?? w.ticket?.wallet?.address ?? null,

        amountXpot: DAILY_XPOT,

        handle: user?.xHandle ?? null,
        name: user?.xName ?? null,
        avatarUrl: user?.xAvatarUrl ?? null,

        txUrl: w.txUrl ?? null,
        isPaidOut: Boolean(w.isPaidOut),

        jackpotUsd: Number(w.jackpotUsd ?? 0),
        payoutUsd: Number(w.payoutUsd ?? 0),
        kind: (w.kind as any) ?? null,
        label: w.label ?? null,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/public/winners/latest error', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
