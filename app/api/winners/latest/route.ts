// app/public/winners/latest/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type LatestWinnerPayload = {
  ok: true;
  winner: {
    id: string;
    drawDate: string | null;
    wallet: string | null;
    amount: number;
    handle: string | null;
    avatarUrl: string | null;
    txUrl: string | null;
    isPaidOut: boolean;
  } | null;
};

export async function GET() {
  try {
    const w = await prisma.winner.findFirst({
      orderBy: { date: 'desc' },
      include: {
        draw: true,
        ticket: {
          include: {
            wallet: {
              include: {
                user: true, // has xHandle, avatarUrl
              },
            },
          },
        },
      },
    });

    if (!w) {
      const payload: LatestWinnerPayload = { ok: true, winner: null };
      return NextResponse.json(payload, { status: 200 });
    }

    // DO NOT ASSUME OPTIONAL COLUMNS
    const anyW = w as any;

    const drawDate =
      w.draw?.drawDate instanceof Date
        ? w.draw.drawDate.toISOString()
        : null;

    const wallet =
      (anyW.walletAddress as string | null | undefined) ??
      (w.ticket?.wallet?.address as string | null | undefined) ??
      null;

    // XPOT daily draw fallback
    const amount = 1_000_000;

    const handle =
      (w.ticket?.wallet?.user?.xHandle as string | null | undefined) ?? null;

    const avatarUrl =
      (w.ticket?.wallet?.user?.avatarUrl as string | null | undefined) ?? null;

    const txUrl =
      (anyW.txUrl as string | null | undefined) ??
      (anyW.payoutTxUrl as string | null | undefined) ??
      null;

    const isPaidOut =
      typeof anyW.isPaidOut === 'boolean'
        ? anyW.isPaidOut
        : Boolean(txUrl);

    const payload: LatestWinnerPayload = {
      ok: true,
      winner: {
        id: w.id,
        drawDate,
        wallet,
        amount,
        handle,
        avatarUrl,
        txUrl,
        isPaidOut,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/public/winners/latest error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
