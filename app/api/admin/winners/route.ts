// app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/admin/_auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Winner is the canonical table for all winners (main + bonus)
    const winners = await prisma.winner.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // limit, adjust if needed
      include: {
        ticket: {
          include: {
            wallet: true,
          },
        },
        draw: true,
      },
    });

    const payload = winners.map(w => ({
      id: w.id,
      date: w.date.toISOString(),
      kind: w.kind ?? 'MAIN',
      label: w.label ?? null,
      ticketId: w.ticketId,
      ticketCode: w.ticketCode,
      wallet: w.ticket?.wallet?.address ?? w.walletAddress,
      jackpotUsd: w.jackpotUsd,
      payoutUsd: w.payoutUsd,
      isPaidOut: w.isPaidOut,
      txUrl: w.txUrl ?? null,
      drawId: w.drawId,
      drawDate: w.draw.drawDate.toISOString(),
    }));

    return NextResponse.json({ ok: true, winners: payload }, { status: 200 });
  } catch (err: any) {
    console.error('[XPOT] /admin/winners error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
