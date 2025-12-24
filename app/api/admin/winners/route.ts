// app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/admin/_auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const winners = await prisma.winner.findMany({
  orderBy: [
    { createdAt: 'desc' },
    { id: 'desc' },
  ],
  take: 50,
  include: {
    ticket: true,
  },
});});

    const payload = winners.map(w => {
      const walletAddress = w.ticket?.wallet?.address ?? w.walletAddress ?? '';

      return {
        id: w.id,
        date: w.date.toISOString(),
        kind: w.kind ?? 'MAIN',
        label: w.label ?? null,

        ticketId: w.ticketId,
        ticketCode: w.ticketCode,

        walletAddress,
        wallet: walletAddress, // keep for backwards compat if anything uses `wallet`

        jackpotUsd: w.jackpotUsd ?? 0,
        payoutUsd: w.payoutUsd ?? 0,
        isPaidOut: !!w.isPaidOut,
        txUrl: w.txUrl ?? null,

        drawId: w.drawId,
        drawDate: w.draw?.drawDate ? w.draw.drawDate.toISOString() : null,
      };
    });

    return NextResponse.json({ ok: true, winners: payload }, { status: 200 });
  } catch (err: any) {
    console.error('[XPOT] /admin/winners error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
