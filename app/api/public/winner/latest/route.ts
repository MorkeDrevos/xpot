// app/api/public/winners/latest/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_XPOT_AMOUNT = 1_000_000;

export async function GET() {
  try {
    const winners = await prisma.winner.findMany({
      where: { kind: 'MAIN' },
      orderBy: { createdAt: 'desc' },
      take: 5,
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

    const payload = winners.map(w => {
      const u = w.ticket?.wallet?.user;

      return {
        id: w.id,
        drawDate: (w.draw?.drawDate ?? w.date ?? w.createdAt).toISOString(),
        handle: u?.xHandle ?? null,
        name: u?.xName ?? null,
        avatarUrl: u?.xAvatarUrl ?? null,
        wallet: w.walletAddress ?? w.ticket?.walletAddress ?? null,
        amount: DEFAULT_XPOT_AMOUNT,
        txUrl: w.txUrl ?? null,
        isPaidOut: Boolean(w.isPaidOut),
      };
    });

    return NextResponse.json({ ok: true, winners: payload }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, winners: [] }, { status: 200 });
  }
}
