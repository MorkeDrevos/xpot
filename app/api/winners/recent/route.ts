// app/api/winners/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(50, Math.floor(n)));
}

export async function GET(req: NextRequest) {
  try {
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 5);

    const winners = await prisma.winner.findMany({
      orderBy: { date: 'desc' }, // your canonical winner timestamp
      take: limit,
      include: {
        draw: true,
        ticket: {
          include: {
            wallet: {
              include: {
                user: true, // gives us xHandle
              },
            },
          },
        },
      },
    });

    const payload = winners.map(w => ({
      id: w.id,
      drawDate: w.draw.drawDate.toISOString(),
      ticketCode: w.ticketCode,
      jackpotUsd: w.jackpotUsd ?? 0,
      walletAddress: w.walletAddress,
      handle: w.ticket?.wallet?.user?.xHandle ?? null,
    }));

    return NextResponse.json({ ok: true, winners: payload }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/winners/recent error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
