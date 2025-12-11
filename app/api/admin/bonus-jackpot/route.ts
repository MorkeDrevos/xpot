// app/api/admin/bonus-schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

const MIN_AMOUNT = 100_000;
const ALLOWED_DELAYS = [5, 15, 30, 60];

type Body = {
  amountXpot?: number;
  label?: string;
  delayMinutes?: number;
};

export async function POST(req: NextRequest) {
  // 1) Admin guard
  await requireAdmin(req);

  // 2) Parse body
  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    // ignore, will fail validation below
  }

  if (!body) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_BODY' },
      { status: 400 },
    );
  }

  const { amountXpot, label, delayMinutes } = body;

  // 3) Validate amount
  if (!amountXpot || !Number.isFinite(amountXpot) || amountXpot < MIN_AMOUNT) {
    return NextResponse.json(
      {
        ok: false,
        error: 'MIN_AMOUNT',
        message: `Enter at least ${MIN_AMOUNT.toLocaleString()} XPOT.`,
      },
      { status: 400 },
    );
  }

  // 4) Validate delay
  if (
    !delayMinutes ||
    !Number.isFinite(delayMinutes) ||
    !ALLOWED_DELAYS.includes(delayMinutes)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_DELAY',
        message: `delayMinutes must be one of: ${ALLOWED_DELAYS.join(', ')}`,
      },
      { status: 400 },
    );
  }

  // 5) Compute when this bonus should fire
  const now = new Date();
  const scheduledAt = new Date(now.getTime() + delayMinutes * 60_000);

  // 6) Find today's draw using Draw.date (your Prisma schema)
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  const todayDraw = await prisma.draw.findFirst({
    where: {
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (!todayDraw) {
    return NextResponse.json(
      {
        ok: false,
        error: 'NO_DRAW_TODAY',
        message: 'No XPOT draw found for today. Auto-draw worker should create it.',
      },
      { status: 400 },
    );
  }

  // 7) Create the bonus drop row
  const drop = await prisma.bonusDrop.create({
    data: {
      drawId: todayDraw.id,
      label: (label || 'Bonus XPOT').trim(),
      amountXpot: Math.floor(amountXpot),
      scheduledAt,
      status: 'SCHEDULED',
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
