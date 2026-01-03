// app/public/winners/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DAILY_XPOT = 1_000_000;

export async function GET() {
  try {
    const winners = await prisma.winner.findMany({
      orderBy: { date: 'desc' },
      take: 10,
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

    const payload = winners.map(w => {
      const user = w.ticket?.wallet?.user ?? null;

      return {
        id: w.id,
        drawDate: w.draw?.drawDate
          ? w.draw.drawDate.toISOString()
          : null,
        wallet: w.walletAddress ?? null,

        // ❗ FIX: Winner has NO amount field
        amount: DAILY_XPOT,

        handle: user?.xHandle ?? null,
        name: user?.xName ?? null,
        avatarUrl: user?.xAvatarUrl ?? null,

        txUrl: w.txUrl ?? null,
        isPaidOut: w.isPaidOut,

        jackpotUsd: Number(w.jackpotUsd ?? 0),
        payoutUsd: Number(w.payoutUsd ?? 0),
      };
    });

    return NextResponse.json({ ok: true, winners: payload }, { status: 200 });
  } catch (err: any) {
    console.error('GET /public/winners error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
