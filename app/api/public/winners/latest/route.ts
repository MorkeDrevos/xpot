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
        { status: 200 },
      );
    }

    const payload = {
      id: w.id,
      drawDate: w.draw.drawDate.toISOString(),
      wallet: w.walletAddress ?? null,

      // ❌ REMOVED:
      // amount: w.amount
      // This field does NOT exist on the Winner model and breaks the build.

      handle: w.ticket?.wallet?.user?.xHandle ?? null,
      name: w.ticket?.wallet?.user?.name ?? null,
      avatarUrl: w.ticket?.wallet?.user?.avatarUrl ?? null,
      txUrl: w.txUrl ?? null,
      isPaidOut: Boolean((w as any).isPaidOut ?? false),
    };

    return NextResponse.json(
      { ok: true, winner: payload },
      { status: 200 },
    );
  } catch (err) {
    console.error('GET /api/public/winners/latest error', err);
    return NextResponse.json(
      { ok: false, winner: null },
      { status: 200 },
    );
  }
}
