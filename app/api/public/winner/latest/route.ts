// app/api/public/winners/latest/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function withAt(handle?: string | null) {
  if (!handle) return null;
  const h = handle.trim();
  if (!h) return null;
  return h.startsWith('@') ? h : `@${h}`;
}

export async function GET() {
  try {
    const winners = await prisma.winner.findMany({
      where: { kind: 'MAIN' },
      orderBy: [{ createdAt: 'desc' }],
      take: 6,
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

    const out = winners.map(w => ({
      id: w.id,
      drawDate: w.draw?.drawDate?.toISOString?.() ?? w.date.toISOString(),
      display:
        withAt(w.ticket?.wallet?.user?.xHandle) ??
        (w.walletAddress ? w.walletAddress : 'winner'),
      txUrl: w.txUrl ?? null,
      isPaidOut: Boolean(w.isPaidOut),
      // If you don’t store XPOT amount per winner yet, keep it deterministic:
      amountXpot: 1_000_000,
      walletAddress: w.walletAddress ?? null,
      ticketCode: w.ticketCode ?? null,
    }));

    return NextResponse.json({ ok: true, winners: out }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
