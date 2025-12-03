// app/api/admin/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today as YYYY-MM-DD string (matches how we stored draw.date earlier)
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
        today: null,
      });
    }

    const today = {
      id: draw.id,
      date: draw.date, // string "2025-12-03"
      status: draw.status as 'open' | 'closed' | 'completed',
      jackpotUsd: draw.jackpotUsd ?? 0,
      rolloverUsd: draw.rolloverUsd ?? 0,
      ticketsCount: draw.tickets.length,
      closesAt: draw.closesAt ?? null,
    };

    return NextResponse.json({ ok: true, today });
  } catch (err: any) {
    console.error('[ADMIN] /today error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to load today' },
      { status: 500 },
    );
  }
}
