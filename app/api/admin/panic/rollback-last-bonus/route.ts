// app/api/admin/panic/rollback-last-bonus/route.ts
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

  const last = await prisma.bonusDrop.findFirst({
    where: { drawId: draw.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!last) {
    return NextResponse.json(
      { ok: false, error: 'NO_BONUS', message: 'No bonus drops exist for today.' },
      { status: 404 },
    );
  }

  await prisma.bonusDrop.delete({ where: { id: last.id } });

  return NextResponse.json({
    ok: true,
    drawId: draw.id,
    deletedBonusDropId: last.id,
  });
}
