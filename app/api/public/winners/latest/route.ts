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
              include: { user: true },
            },
          },
        },
      },
    });

    if (!w) {
      return NextResponse.json({ ok: true, winner: null }, { status: 200 });
    }

    const payload = {
      id: w.id,
      drawDate: w.draw.drawDate.toISOString(),

      // Winner wallet (this exists in your Winner model)
      wallet: w.walletAddress ?? null,

      // This exists in your User model
      handle: w.ticket?.wallet?.user?.xHandle ?? null,

      // Safe optional fields
      txUrl: w.txUrl ?? null,

      // Keep future-proof payout flag (won't break types)
      isPaidOut: Boolean((w as any).isPaidOut ?? false),
    };

    return NextResponse.json({ ok: true, winner: payload }, { status: 200 });
  } catch (err) {
    console.error('GET /api/public/winners/latest error', err);
    return NextResponse.json({ ok: false, winner: null }, { status: 200 });
  }
}
