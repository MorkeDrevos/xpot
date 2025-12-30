// app/api/ops/winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function mapKind(k: any): 'main' | 'bonus' {
  const raw = String(k ?? '').toUpperCase();
  if (raw === 'BONUS') return 'bonus';
  return 'main';
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const winners = await prisma.winner.findMany({
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: 50,
      select: {
        id: true,
        drawId: true,
        date: true,
        ticketCode: true,
        walletAddress: true,
        jackpotUsd: true,
        payoutUsd: true,
        isPaidOut: true,
        txUrl: true,
        kind: true,
        label: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        winners: winners.map(w => ({
          id: w.id,
          drawId: w.drawId,
          date: w.date.toISOString(),
          ticketCode: w.ticketCode ?? '',
          walletAddress: w.walletAddress ?? '',
          jackpotUsd: Number(w.jackpotUsd ?? 0),
          payoutUsd: Number(w.payoutUsd ?? 0),
          isPaidOut: !!w.isPaidOut,
          txUrl: w.txUrl ?? null,
          kind: mapKind(w.kind),
          label: w.label ?? null,
        })),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'OPS_WINNERS_FAILED' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
