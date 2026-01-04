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
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 5);

    const winners = await prisma.winner.findMany({
      orderBy: { date: 'desc' },
      take: limit,
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

    const payload = winners.map(w => {
      const user: any = (w as any)?.ticket?.wallet?.user ?? null;

      // try common field names, fall back safely
      const handle =
        user?.xHandle ??
        user?.handle ??
        user?.twitterHandle ??
        user?.x_username ??
        null;

      const name =
        user?.xName ??
        user?.name ??
        user?.displayName ??
        user?.twitterName ??
        null;

      const avatarUrl =
        user?.xAvatarUrl ??
        user?.avatarUrl ??
        user?.imageUrl ??
        user?.profileImageUrl ??
        null;

      return {
        id: w.id,
        kind: (w as any).kind ?? (w as any).winnerKind ?? null,
        label: (w as any).label ?? null,

        drawDate: safeIso((w as any)?.draw?.drawDate ?? (w as any)?.date ?? (w as any)?.createdAt),
        ticketCode: (w as any)?.ticketCode ?? null,

        walletAddress: (w as any)?.walletAddress ?? (w as any)?.ticket?.wallet?.address ?? null,

        handle,
        name,
        avatarUrl,

        // payout + proof
        amountXpot:
          (w as any)?.amountXpot ??
          (w as any)?.payoutXpot ??
          (w as any)?.jackpotXpot ??
          null,

        isPaidOut: (w as any)?.isPaidOut ?? null,
        txUrl: (w as any)?.txUrl ?? null,
        txSig: (w as any)?.txSig ?? null,
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
