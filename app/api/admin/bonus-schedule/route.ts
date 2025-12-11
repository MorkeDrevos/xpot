// app/api/admin/bonus-schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  // Admin guard
  await requireAdmin(req);

  // Try to read JSON body (label, amountXpot, delayMinutes)
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const labelRaw = (body.label as string | undefined) ?? '';
  const label = labelRaw.trim() || 'Bonus XPOT';

  const amountXpot = Number(body.amountXpot ?? 0);
  const delayMinutes = Number(body.delayMinutes ?? 0);

  if (!Number.isFinite(amountXpot) || amountXpot <= 0) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_AMOUNT' },
      { status: 400 },
    );
  }

  if (!Number.isFinite(delayMinutes) || delayMinutes < 0) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_DELAY' },
      { status: 400 },
    );
  }

  // Today window (UTC) – we query by drawDate
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  // Find today's draw by drawDate
  const todayDraw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      tickets: true,
    },
  });

  if (!todayDraw) {
    return NextResponse.json(
      { ok: false, error: 'NO_DRAW_TODAY' },
      { status: 400 },
    );
  }

  if (!todayDraw.tickets.length) {
    return NextResponse.json(
      { ok: false, error: 'NO_TICKETS_TODAY' },
      { status: 400 },
    );
  }

  // When the bonus should fire
  const scheduledAt = new Date(Date.now() + delayMinutes * 60_000);

  // Create the bonus drop row
  const drop = await prisma.bonusDrop.create({
    data: {
      drawId: todayDraw.id,
      label,
      amountXpot: Math.floor(amountXpot),
      scheduledAt,
      status: 'SCHEDULED', // matches BonusDropStatus enum
    },
  });

  return NextResponse.json(
    {
      ok: true,
      drop,
    },
    { status: 200 },
  );
}
