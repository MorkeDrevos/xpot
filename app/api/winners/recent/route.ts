// app/api/winners/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(80, Math.floor(n))); // allow up to 80 for UI
}

function safeIso(d: any) {
  try {
    if (!d) return null;
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 5);

    const winners = await prisma.winner.findMany({
      orderBy: { date: 'desc' }, // canonical winner timestamp
      take: limit,
      include: {
        draw: true,
        ticket: {
          include: {
            wallet: {
              include: {
                user: true, // gives us xHandle
              },
            },
          },
        },
      },
    });

    const payload = winners.map(w => ({
      id: w.id,

      // dates
      drawDate: safeIso(w.draw?.drawDate ?? w.date ?? w.createdAt),

      // ids/codes
      ticketCode: w.ticketCode ?? null,

      // values
      jackpotUsd: w.jackpotUsd ?? null,
      amountXpot: (w as any).payoutXpot ?? (w as any).amountXpot ?? null, // optional if exists in schema

      // identity
      walletAddress: w.walletAddress ?? w.ticket?.wallet?.address ?? null,
      handle: w.ticket?.wallet?.user?.xHandle ?? null,

      // payout/proof
      isPaidOut: (w as any).isPaidOut ?? null,
      txUrl: (w as any).txUrl ?? null,
      txSig: (w as any).txSig ?? null,

      // classification (if present)
      kind: (w as any).kind ?? (w as any).winnerKind ?? null,
      label: (w as any).label ?? null,
    }));

    return NextResponse.json({ ok: true, winners: payload }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/winners/recent error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
