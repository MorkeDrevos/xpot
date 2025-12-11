// app/api/admin/draw/recent-winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../../_auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // 1) Load recent MAIN winners (limit 20)
    const winners = await prisma.winner.findMany({
      where: {
        kind: 'MAIN',
      },
      orderBy: { date: 'desc' },
      take: 20,
      include: {
        draw: true,
        ticket: {
          include: {
            wallet: true,
          },
        },
      },
    });

    // 2) Normalize payload
    const payload = winners.map(w => ({
      id: w.id,
      date: w.date.toISOString(),
      drawId: w.drawId,
      ticketId: w.ticketId,
      ticketCode: w.ticketCode,
      wallet: w.walletAddress,
      jackpotUsd: w.jackpotUsd ?? 0,
      drawDate: w.draw.drawDate.toISOString(),
    }));

    return NextResponse.json({ ok: true, winners: payload }, { status: 200 });
  } catch (err: any) {
    console.error('[XPOT] /admin/draw/recent-winners error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
