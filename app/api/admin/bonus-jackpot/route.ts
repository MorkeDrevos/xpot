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
  // Admin guard (throws 401/403 if invalid)
  await requireAdmin(req);

  // Parse body
  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    // ignore, body stays null
  }

  if (!body) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_BODY' },
      { status: 400 },
    );
  }

  const { amountXpot, label, delayMinutes } = body;

  // Validate amount
  if (!amountXpot || !Number.isFinite(amountXpot) || amountXpot < MIN_AMOUNT) {
    return NextResponse.json(
      {
        ok: false,
        error: `MIN_AMOUNT_${MIN_AMOUNT}`,
        message: `Enter a valid XPOT amount (min ${MIN_AMOUNT.toLocaleString()} XPOT).`,
      },
      { status: 400 },
    );
  }

  // Validate delay
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

  // Compute scheduledAt
  const now = new Date();
  const scheduledAt = new Date(now.getTime() + delayMinutes * 60_000);

  // Find today's draw by date (matches your Prisma schema: Draw.date)
  const todayStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
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

  // Create the bonus drop row
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
