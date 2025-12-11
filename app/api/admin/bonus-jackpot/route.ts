// app/api/admin/bonus-schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

// Minimum bonus amount and allowed delay options (minutes)
const MIN_AMOUNT_XPOT = 100_000;
const ALLOWED_DELAYS = [5, 15, 30, 60];

type Body = {
  label?: string;
  amountXpot?: number;
  delayMinutes?: number;
};

export async function POST(req: NextRequest) {
  // ── 1) Admin guard ──────────────────────────────────────────────
  await requireAdmin(req);

  // ── 2) Parse body ───────────────────────────────────────────────
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'INVALID_JSON' },
      { status: 400 },
    );
  }

  const rawLabel = body.label ?? '';
  const amountXpot = body.amountXpot;
  const delayMinutes = body.delayMinutes ?? 5;

  // ── 3) Validate payload ─────────────────────────────────────────
  if (
    typeof amountXpot !== 'number' ||
    !Number.isFinite(amountXpot) ||
    amountXpot < MIN_AMOUNT_XPOT
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_AMOUNT',
        message: `amountXpot must be at least ${MIN_AMOUNT_XPOT}.`,
      },
      { status: 400 },
    );
  }

  if (!ALLOWED_DELAYS.includes(delayMinutes)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_DELAY',
        message: `delayMinutes must be one of: ${ALLOWED_DELAYS.join(', ')}`,
      },
      { status: 400 },
    );
  }

  // ── 4) Find today's draw ────────────────────────────────────────
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const todayDraw = await prisma.draw.findFirst({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  if (!todayDraw) {
    return NextResponse.json(
      {
        ok: false,
        error: 'NO_TODAY_DRAW',
        message: 'No XPOT draw found for today.',
      },
      { status: 404 },
    );
  }

  // ── 5) Compute scheduledAt ──────────────────────────────────────
  const scheduledAt = new Date(now.getTime() + delayMinutes * 60_000);

  // ── 6) Create bonus drop row ────────────────────────────────────
  const drop = await prisma.bonusDrop.create({
    data: {
      drawId: todayDraw.id,
      label: rawLabel.trim() || 'Bonus XPOT',
      amountXpot: Math.floor(amountXpot),
      scheduledAt,
      status: 'SCHEDULED',
    },
  });

  // ── 7) Respond ──────────────────────────────────────────────────
  return NextResponse.json(
    {
      ok: true,
      drop,
    },
    { status: 201 },
  );
}
