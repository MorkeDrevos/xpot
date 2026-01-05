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

function pickAmountXpot(w: any): number | null {
  const candidates = [
    w?.amountXpot,
    w?.payoutXpot,
    w?.amount, // some schemas use "amount"
    w?.payoutAmount,
  ];

  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 50);

    /**
     * ✅ ONE DRAW = ONE PUBLIC WINNER
     * Query winners, but dedupe by drawId.
     *
     * NOTE:
     * - `distinct: ['drawId']` ensures max 1 winner per draw.
     * - We over-fetch a bit so distinct still returns enough rows.
     */
    const raw = await prisma.winner.findMany({
      take: Math.min(limit * 5, 5000),
      orderBy: [
        // prefer winner "date" if you have it, else fallback to drawDate via relation
        { date: 'desc' as any },
        { createdAt: 'desc' as any },
      ],
      distinct: ['drawId'] as any,
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

    // If your DB contains winners attached to non-closed draws, filter them out here.
    const winners = raw
      .filter(w => {
        const draw = (w as any).draw;
        // if draw has status, enforce closed; otherwise just allow it
        return !draw?.status || draw.status === 'closed';
      })
      .slice(0, limit);

    const payload = winners.map(w => {
      const draw = (w as any).draw;
      const ticket = (w as any).ticket;
      const wallet = ticket?.wallet;
      const user = wallet?.user;

      return {
        // ✅ canonical IDs
        id: w.id,
        drawId: (w as any).drawId ?? draw?.id ?? null,

        kind: (w as any).kind ?? 'MAIN',
        label: (w as any).label ?? null,

        // prefer draw.drawDate, fallback to winner.date
        drawDate: safeIso(draw?.drawDate ?? (w as any).date ?? (w as any).createdAt),

        // ticket code (winner may store it, or ticket may store it)
        ticketCode: (w as any).ticketCode ?? ticket?.code ?? null,

        amountXpot: pickAmountXpot(w),

        walletAddress: wallet?.address ?? null,

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
