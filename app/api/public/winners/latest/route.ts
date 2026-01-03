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
      drawDate: w.draw?.drawDate ? w.draw.drawDate.toISOString() : null,
      wallet: (w as any).walletAddress ?? null, // keep tolerant if schema differs
      handle: (w as any)?.ticket?.wallet?.user?.xHandle ?? null,
      txUrl: (w as any).txUrl ?? null,
      isPaidOut: Boolean((w as any).isPaidOut ?? false),
    };

    return NextResponse.json({ ok: true, winner: payload }, { status: 200 });
  } catch (err) {
    console.error('GET /api/public/winners/latest error', err);
    return NextResponse.json({ ok: false, winner: null }, { status: 200 });
  }
}
