// app/api/public/last-winners/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function shorten(addr: string, left = 6, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || '2'), 1), 10);

    const winners = await prisma.winner.findMany({
      where: { kind: 'MAIN' },
      orderBy: [{ date: 'desc' }],
      take: limit,
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

    const rows = winners.map(w => {
      const xHandle = w.ticket?.wallet?.user?.xHandle || null;
      const walletAddress = w.walletAddress || w.ticket?.walletAddress || '';

      return {
        id: w.id,
        // prefer draw bucket date if present, else winner timestamp
        drawDate: w.draw?.drawDate ? w.draw.drawDate.toISOString() : w.date.toISOString(),
        xHandle,
        walletAddress,
        display: xHandle ? `@${xHandle.replace(/^@/, '')}` : shorten(walletAddress, 6, 6),
        txUrl: w.txUrl || null,
        isPaidOut: Boolean(w.isPaidOut),
      };
    });

    return NextResponse.json({ ok: true, winners: rows }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
