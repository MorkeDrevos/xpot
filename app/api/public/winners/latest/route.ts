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

    const user = w.ticket?.wallet?.user ?? null;

    // IMPORTANT:
    // - draw.drawDate = "day bucket" (00:00Z of the draw day)
    // - winner.date = the actual winner timestamp (your 22:00 Madrid moment stored in UTC)
    const payload = {
      id: w.id,

      // "Day bucket" for grouping
      drawDay: w.draw?.drawDate ? w.draw.drawDate.toISOString() : null,

      // Canonical "winner happened at" timestamp (use this for UI display)
      drawDate: w.date ? w.date.toISOString() : null,

      wallet: w.walletAddress ?? null,
      ticketCode: w.ticketCode ?? null,

      // Identity resolved through Wallet -> User
      handle: user?.xHandle ?? null,
      name: user?.xName ?? null,
      avatarUrl: user?.xAvatarUrl ?? null,

      txUrl: w.txUrl ?? null,
      isPaidOut: Boolean(w.isPaidOut),

      kind: w.kind ?? 'MAIN',
      label: w.label ?? null,

      // Optional numeric fields (safe defaults)
      payoutUsd: typeof w.payoutUsd === 'number' ? w.payoutUsd : 0,
      jackpotUsd: typeof w.jackpotUsd === 'number' ? w.jackpotUsd : 0,
    };

    return NextResponse.json({ ok: true, winner: payload }, { status: 200 });
  } catch (err) {
    console.error('GET /api/public/winners/latest error', err);
    return NextResponse.json({ ok: false, winner: null }, { status: 200 });
  }
}
