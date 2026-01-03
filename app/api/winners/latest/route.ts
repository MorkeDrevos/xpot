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

    // Keep the field name "amount" if your homepage already expects it
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
      const payload: LatestWinnerPayload = { ok: true, winner: null };
      return NextResponse.json(payload, { status: 200 });
    }

    const user = w.ticket?.wallet?.user ?? null;

    const payload: LatestWinnerPayload = {
      ok: true,
      winner: {
        id: w.id,
        drawDate:
          w.draw?.drawDate instanceof Date ? w.draw.drawDate.toISOString() : null,
        wallet: w.walletAddress ?? null,

        // ✅ Winner has no amount field in your schema, so we provide the protocol constant
        amount: DAILY_XPOT,

        // ✅ Matches your User model fields
        handle: user?.xHandle ?? null,
        name: user?.xName ?? null,
        avatarUrl: user?.xAvatarUrl ?? null,

        txUrl: w.txUrl ?? null,
        isPaidOut: w.isPaidOut,

        jackpotUsd: Number(w.jackpotUsd ?? 0),
        payoutUsd: Number(w.payoutUsd ?? 0),
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error('GET /public/winners/latest error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
