// app/api/admin/bonus-upcoming/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

function todayUtcStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const drawDate = todayUtcStart();
    const draw = await prisma.draw.findUnique({
      where: { drawDate },
      select: { id: true },
    });

    if (!draw) {
      return NextResponse.json({ upcoming: [] });
    }

    const upcoming = await prisma.bonusDrop.findMany({
      where: {
        drawId: draw.id,
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date(Date.now() - 60_000) }, // allow slight clock drift
      },
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true,
        label: true,
        amountXpot: true,
        scheduledAt: true,
        status: true,
      },
    });

    return NextResponse.json({
      upcoming: upcoming.map((d) => ({
        id: d.id,
        label: d.label,
        amountXpot: d.amountXpot,
        scheduledAt: d.scheduledAt.toISOString(),
        status: d.status,
      })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'BONUS_UPCOMING_FAILED', message: String(e?.message || e) },
      { status: 500 },
    );
  }
}
