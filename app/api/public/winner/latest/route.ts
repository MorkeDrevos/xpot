// app/api/public/winner/latest/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function pickFirst<T>(...vals: Array<T | null | undefined>): T | null {
  for (const v of vals) if (v !== null && v !== undefined) return v;
  return null;
}

export async function GET() {
  try {
    // Try to find the most recent draw that has a winner recorded
    // Adjust field names once you confirm schema (winnerWallet, winnerHandle etc.)
    const d: any = await prisma.draw.findFirst({
      orderBy: [{ drawDate: 'desc' }, { createdAt: 'desc' }].filter(Boolean) as any,
      where: {
        OR: [
          { winnerWallet: { not: null } } as any,
          { winnerAddress: { not: null } } as any,
          { winnerHandle: { not: null } } as any,
          { winnerX: { not: null } } as any,
        ],
      } as any,
      // If you store a winning ticket relation, add it here once confirmed:
      // include: { winningTicket: true },
    });

    if (!d) {
      return NextResponse.json({ winner: null }, { status: 200 });
    }

    const winnerHandle = pickFirst<string>(
      d.winnerHandle,
      d.winnerX,
      d.winnerUsername,
      d.winner,
      null,
    );

    const winnerWallet = pickFirst<string>(
      d.winnerWallet,
      d.winnerAddress,
      d.winnerPublicKey,
      null,
    );

    const drawDate = pickFirst<string>(
      d.drawDate ? new Date(d.drawDate).toISOString() : null,
      d.closedAt ? new Date(d.closedAt).toISOString() : null,
      null,
    );

    const amount = pickFirst<number>(d.payoutAmount, d.amount, d.rewardAmount, 1_000_000);

    return NextResponse.json(
      {
        winner: {
          handle: winnerHandle,
          wallet: winnerWallet,
          amount,
          drawDate,
          // tx: d.payoutTxSig ?? null,
        },
      },
      {
        status: 200,
        headers: {
          // ensure freshness everywhere
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch (e) {
    return NextResponse.json({ winner: null }, { status: 200 });
  }
}
