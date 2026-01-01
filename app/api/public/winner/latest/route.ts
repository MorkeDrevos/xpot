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

    const out = winners.map(w => {
      const user = w.ticket?.wallet?.user ?? null;
      const handle = withAt((user as any)?.xHandle ?? null);

      return {
        id: w.id,
        handle,
        name: (user as any)?.xName ?? null,
        avatarUrl: (user as any)?.xAvatarUrl ?? null,

        wallet: w.walletAddress ?? w.ticket?.wallet?.address ?? null,

        // homepage expects "amount" (number). keep deterministic if you don’t store it yet
        amount: 1_000_000,

        drawDate: (w.draw?.drawDate ?? (w as any).date)?.toISOString?.() ?? null,

        txUrl: w.txUrl ?? null,
        isPaidOut: Boolean(w.isPaidOut),
      };
    });

    return NextResponse.json({ ok: true, winners: out }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, winners: [] }, { status: 200 });
  }
}
