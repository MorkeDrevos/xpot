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
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 10);

    const winners = await prisma.winner.findMany({
      orderBy: { date: 'desc' },
      take: limit,
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

    const payload = winners.map(w => ({
      id: w.id,
      drawDate: w.draw.drawDate.toISOString(),
      wallet: w.walletAddress ?? null,
      amount: (w.amount ?? null) as number | null,
      handle: w.ticket?.wallet?.user?.xHandle ?? null,
      name: w.ticket?.wallet?.user?.name ?? null,
      avatarUrl: w.ticket?.wallet?.user?.avatarUrl ?? null,
      txUrl: (w.txUrl ?? null) as string | null,
      isPaidOut: Boolean((w as any).isPaidOut ?? false),
    }));

    return NextResponse.json({ ok: true, winners: payload }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/public/winners error', err);
    return NextResponse.json({ ok: false, winners: [] }, { status: 200 });
  }
}
