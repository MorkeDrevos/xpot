// app/api/public/winners/latest/route.ts
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
      return NextResponse.json({ ok: true, winner: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        ok: true,
        winner: {
          id: w.id,
          handle: w.ticket?.wallet?.user?.xHandle ?? null,
          wallet: w.walletAddress ?? null,
          amount: null, // you can wire this if/when you store payout amount per winner
          drawDate: w.draw?.drawDate ? w.draw.drawDate.toISOString() : null,
          txUrl: null, // add if you store payout tx
          isPaidOut: null, // add if you store paid flag
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('GET /api/public/winners/latest error', err);
    return NextResponse.json({ ok: false, error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
