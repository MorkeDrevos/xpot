import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
                user: true,
              },
            },
          },
        },
      },
    });

    if (!w) {
      return NextResponse.json(
        { ok: true, winner: null },
        { status: 200 }
      );
    }

    // Use `any` for optional fields so Prisma type changes never break builds
    const winnerAny = w as any;
    const userAny = (w.ticket?.wallet?.user as any) ?? null;

    const payload = {
      id: w.id,
      drawDate: w.draw?.drawDate
        ? w.draw.drawDate.toISOString()
        : null,

      // winner wallet (exists in your Winner model)
      wallet: w.walletAddress ?? null,

      // optional / future-safe fields
      amount: winnerAny.amount ?? null,
      txUrl: winnerAny.txUrl ?? null,
      isPaidOut: Boolean(winnerAny.isPaidOut ?? false),

      // user-facing identity (only if present in schema)
      handle: userAny?.xHandle ?? null,
      name: userAny?.name ?? null,
      avatarUrl: userAny?.avatarUrl ?? null,
    };

    return NextResponse.json(
      { ok: true, winner: payload },
      { status: 200 }
    );
  } catch (err) {
    console.error('GET /api/public/winners/latest error', err);
    return NextResponse.json(
      { ok: false, winner: null },
      { status: 200 }
    );
  }
}
