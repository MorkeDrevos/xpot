// app/api/public/winners/latest/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function pickFirst<T>(...vals: Array<T | null | undefined>): T | null {
  for (const v of vals) if (v !== null && v !== undefined) return v;
  return null;
}

function toIsoSafe(v: any): string | null {
  try {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // We try "draw has winner fields" first.
    // If your schema differs, tell me the exact model fields and I’ll lock it perfectly.
    const draws: any[] = await (prisma as any).draw.findMany({
      take: 2,
      orderBy: [{ drawDate: 'desc' }, { createdAt: 'desc' }].filter(Boolean),
      where: {
        OR: [
          { winnerHandle: { not: null } },
          { winnerX: { not: null } },
          { winnerUsername: { not: null } },
          { winnerWallet: { not: null } },
          { winnerAddress: { not: null } },
          { winnerPublicKey: { not: null } },
        ],
      },
    });

    const winners = (draws || []).map(d => {
      const handle = pickFirst<string>(d.winnerHandle, d.winnerX, d.winnerUsername, d.winner, null);
      const wallet = pickFirst<string>(d.winnerWallet, d.winnerAddress, d.winnerPublicKey, null);
      const amount = pickFirst<number>(d.payoutAmount, d.amount, d.rewardAmount, 1_000_000);
      const drawDate = pickFirst<string>(toIsoSafe(d.drawDate), toIsoSafe(d.closedAt), toIsoSafe(d.createdAt));
      const tx = pickFirst<string>(d.payoutTxSig, d.txSig, d.winnerTx, null);

      return { handle, wallet, amount, drawDate, tx };
    });

    return NextResponse.json(
      { winners },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch {
    return NextResponse.json(
      { winners: [] },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  }
}
