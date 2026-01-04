// app/api/winners/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(80, Math.floor(n)));
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
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 20);

    const winners = await prisma.winner.findMany({
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        draw: true,
        ticket: {
          include: {
            wallet: {
              include: {
                user: true, // xHandle / xName / xAvatarUrl
              },
            },
          },
        },
      },
    });

    const payload = winners.map(w => {
      const user = w.ticket?.wallet?.user;

      // IMPORTANT:
      // You said payoutUsd is actually XPOT amount (historical naming).
      // So amountXpot = payoutUsd.
      const amountXpot =
        typeof (w as any).payoutUsd === 'number' && Number.isFinite((w as any).payoutUsd)
          ? (w as any).payoutUsd
          : null;

      // Prefer draw.drawDate if it exists, fallback to winner.date, then createdAt
      const drawDate =
        safeIso((w as any).draw?.drawDate) ?? safeIso((w as any).date) ?? safeIso((w as any).createdAt);

      return {
        id: w.id,

        kind: (w as any).kind ?? null,
        label: (w as any).label ?? null,

        drawDate,
        ticketCode: (w as any).ticketCode ?? null,

        // XPOT amount:
        amountXpot,

        walletAddress: (w as any).walletAddress ?? null,

        // X identity (if present)
        handle: user?.xHandle ?? null,
        name: (user as any)?.xName ?? null,
        avatarUrl: (user as any)?.xAvatarUrl ?? null,

        // payout/proof
        isPaidOut: typeof (w as any).isPaidOut === 'boolean' ? (w as any).isPaidOut : null,
        txUrl: (w as any).txUrl ?? null,
        txSig: (w as any).txSig ?? null,
      };
    });

    return NextResponse.json({ ok: true, winners: payload }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/winners/recent error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
