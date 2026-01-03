// app/public/winners/latest/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type LatestWinnerPayload = {
  ok: true;
  winner: {
    id: string;
    drawDate: string | null; // ISO
    wallet: string | null;
    amount: number | null;
    handle: string | null;
    name: string | null;
    avatarUrl: string | null;
    txUrl: string | null;
    isPaidOut: boolean;
  } | null;
};

export async function GET() {
  try {
    const w = await prisma.winner.findFirst({
      orderBy: { date: 'desc' }, // your canonical winner timestamp
      include: {
        draw: true,
        ticket: {
          include: {
            wallet: {
              include: {
                user: true, // xHandle, name, avatar, etc.
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

    // IMPORTANT:
    // Your schema may or may not have these fields on winner.
    // So we read safely with `any` and fall back cleanly.
    const anyW = w as any;

    const drawDateISO =
      w.draw?.drawDate instanceof Date ? w.draw.drawDate.toISOString() : null;

    const wallet =
      (anyW.walletAddress as string | null | undefined) ??
      (w.ticket?.wallet?.address as string | null | undefined) ??
      null;

    const amount =
      typeof anyW.amount === 'number' && Number.isFinite(anyW.amount)
        ? (anyW.amount as number)
        : 1_000_000;

    const handle =
      (w.ticket?.wallet?.user?.xHandle as string | null | undefined) ?? null;

    const name =
      (w.ticket?.wallet?.user?.name as string | null | undefined) ?? null;

    const avatarUrl =
      (w.ticket?.wallet?.user?.avatarUrl as string | null | undefined) ?? null;

    const txUrl =
      (anyW.txUrl as string | null | undefined) ??
      (anyW.payoutTxUrl as string | null | undefined) ??
      null;

    const isPaidOut =
      typeof anyW.isPaidOut === 'boolean'
        ? (anyW.isPaidOut as boolean)
        : Boolean(txUrl);

    const payload: LatestWinnerPayload = {
      ok: true,
      winner: {
        id: w.id,
        drawDate: drawDateISO,
        wallet,
        amount,
        handle,
        name,
        avatarUrl,
        txUrl,
        isPaidOut,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error('GET /app/public/winners/latest error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
