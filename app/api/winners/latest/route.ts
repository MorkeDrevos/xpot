// app/api/winners/latest/route.ts
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
      orderBy: { date: 'desc' }, // canonical winner timestamp
      include: {
        draw: true,
        ticket: {
          include: {
            wallet: {
              include: {
                user: true, // may NOT have name/avatarUrl typed in Prisma
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

    // Avoid guessing Prisma columns on Winner too
    const anyW = w as any;

    const drawDate =
      w.draw?.drawDate instanceof Date ? w.draw.drawDate.toISOString() : null;

    const wallet =
      (anyW.walletAddress as string | null | undefined) ??
      ((w.ticket?.wallet as any)?.address as string | null | undefined) ??
      null;

    // If your daily payout is fixed, keep it fixed (safe + no schema reliance)
    const amount = 1_000_000;

    // DO NOT access user.avatarUrl or user.name directly - Prisma type doesn't have them
    const userAny = (w.ticket?.wallet?.user as any) ?? null;

    const handle =
      (userAny?.xHandle as string | null | undefined) ??
      (userAny?.handle as string | null | undefined) ??
      null;

    const avatarUrl =
      (userAny?.avatarUrl as string | null | undefined) ??
      (userAny?.imageUrl as string | null | undefined) ??
      (userAny?.profileImageUrl as string | null | undefined) ??
      null;

    const txUrl =
      (anyW.txUrl as string | null | undefined) ??
      (anyW.payoutTxUrl as string | null | undefined) ??
      null;

    const isPaidOut =
      typeof anyW.isPaidOut === 'boolean' ? anyW.isPaidOut : Boolean(txUrl);

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
    console.error('GET /api/winners/latest error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
