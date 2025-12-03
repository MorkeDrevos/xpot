// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.findFirst({
      where: { date: todayStr },
      include: {
        tickets: true,
      },
    });

    if (!draw) {
      return NextResponse.json({
        ok: true,
        tickets: [],
      });
    }

    const tickets = draw.tickets
      .sort((a, b) => {
        const da = (a.createdAt as Date).getTime();
        const db = (b.createdAt as Date).getTime();
        return db - da; // latest first
      })
      .map(t => ({
        id: t.id,
        code: t.code,
        walletAddress: t.walletAddress,
        status: (t.status as string).toLowerCase() as
          | 'in-draw'
          | 'expired'
          | 'not-picked'
          | 'won'
          | 'claimed',
        createdAt:
          t.createdAt instanceof Date
            ? t.createdAt.toISOString()
            : (t.createdAt as any),
        jackpotUsd: t.jackpotUsd ?? draw.jackpotUsd ?? 0,
      }));

    return NextResponse.json({ ok: true, tickets });
  } catch (err: any) {
    console.error('[ADMIN] /tickets error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to load tickets' },
      { status: 500 },
    );
  }
}
