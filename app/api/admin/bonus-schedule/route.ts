import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  // Admin guard
  await requireAdmin(req);

  const { searchParams } = new URL(req.url);
  const label = searchParams.get('label') ?? '';
  const amountXpot = Number(searchParams.get('amountXpot') ?? 0);
  const delayMinutes = Number(searchParams.get('delayMinutes') ?? 0);

  if (!label) {
    return NextResponse.json(
      { ok: false, error: 'Missing label' },
      { status: 400 }
    );
  }

  if (!amountXpot || amountXpot < 1) {
    return NextResponse.json(
      { ok: false, error: 'Invalid amountXpot' },
      { status: 400 }
    );
  }

  // 1) Load TODAY'S DRAW
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const drawToday = await prisma.draw.findFirst({
    where: {
      date: {
        gte: new Date(`${todayStr}T00:00:00Z`),
        lt: new Date(`${todayStr}T23:59:59Z`),
      },
    },
    include: { tickets: true },
  });

  if (!drawToday) {
    return NextResponse.json(
      { ok: false, error: 'NO_DRAW_TODAY' },
      { status: 400 }
    );
  }

  // 2) Compute scheduled time
  const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  // 3) Create BonusDrop row
  const drop = await prisma.bonusDrop.create({
    data: {
      drawId: drawToday.id,
      label: `${label} (Bonus XPOT)`.trim(),
      amountXpot,
      scheduledAt,
      status: 'SCHEDULED',
    },
  });

  return NextResponse.json(
    {
      ok: true,
      drop,
    },
    { status: 200 }
  );
}
