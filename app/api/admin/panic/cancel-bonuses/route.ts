// app/api/admin/panic/cancel-bonuses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../../_auth';

export const dynamic = 'force-dynamic';

function todayUtcStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const drawDate = todayUtcStart();
  const draw = await prisma.draw.findUnique({ where: { drawDate } });

  if (!draw) {
    return NextResponse.json(
      { ok: false, error: 'NO_DRAW', message: 'No draw found for today.' },
      { status: 404 },
    );
  }

  const result = await prisma.bonusDrop.updateMany({
    where: {
      drawId: draw.id,
      status: 'SCHEDULED',
    },
    data: {
      status: 'CANCELLED',
    },
  });

  return NextResponse.json({
    ok: true,
    drawId: draw.id,
    cancelled: result.count,
  });
}
