// app/api/winners/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// allow large limits for archive pages
function intParam(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(5000, Math.floor(n)));
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
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 50);

    /**
     * ✅ ONE DRAW = ONE PUBLIC WINNER
     * We query draws, not winners.
     */
    const draws = await prisma.draw.findMany({
      where: {
        status: 'closed',
      },
      orderBy: {
        drawDate: 'desc',
      },
      take: limit,
      include: {
        winner: true,
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

    const payload = draws
      .filter(d => d.winner) // safety
      .map(d => {
        const w = d.winner!;
        const user = d.ticket?.wallet?.user;

        const amountXpot =
          typeof (w as any).payoutUsd === 'number' && Number.isFinite((w as any).payoutUsd)
            ? (w as any).payoutUsd
            : null;

        return {
          // ✅ canonical IDs
          id: w.id,
          drawId: d.id,

          kind: (w as any).kind ?? 'MAIN',
          label: (w as any).label ?? null,

          drawDate: safeIso(d.drawDate),
          ticketCode: (w as any).ticketCode ?? null,

          amountXpot,

          walletAddress: d.ticket?.wallet?.address ?? null,

          // X identity
          handle: user?.xHandle ?? null,
          name: (user as any)?.xName ?? null,
          avatarUrl: (user as any)?.xAvatarUrl ?? null,

          isPaidOut: typeof (w as any).isPaidOut === 'boolean' ? (w as any).isPaidOut : null,
          txUrl: (w as any).txUrl ?? null,
          txSig: (w as any).txSig ?? null,
        };
      });

    return NextResponse.json(
      {
        ok: true,
        winners: payload,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('GET /api/winners/recent error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
