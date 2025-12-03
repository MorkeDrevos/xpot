// app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const winners = await prisma.winner.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        draw: true,
      },
    });

    const payload = winners.map(w => ({
      id: w.id,
      drawId: w.drawId,
      date:
        w.createdAt instanceof Date
          ? w.createdAt.toISOString()
          : (w.createdAt as any),
      ticketCode: w.ticketCode,
      walletAddress: w.walletAddress,
      jackpotUsd: w.jackpotUsd ?? w.payoutUsd ?? 0,
      payoutUsd: w.payoutUsd ?? 0,
      isPaidOut: w.isPaidOut ?? false,
      txUrl: w.txUrl ?? null,
    }));

    return NextResponse.json({ ok: true, winners: payload });
  } catch (err: any) {
    console.error('[ADMIN] /winners error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to load winners' },
      { status: 500 },
    );
  }
}
