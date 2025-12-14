// app/api/admin/bonus-schedule/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

function todayUtcStart(d = new Date()) {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

const ALLOWED_MINUTES = [5, 15, 30, 60] as const;

type Body = {
  amountXpot?: number | string;
  label?: string;

  // legacy + UI variants (support both)
  minutesFromNow?: number | string;
  delayMinutes?: number | string;

  // optional ISO, overrides minutes values if present
  scheduledAt?: string;
};

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const drawDate = todayUtcStart();
  const draw = await prisma.draw.findUnique({ where: { drawDate } });

  if (!draw) {
    return NextResponse.json({
      ok: true,
      drawExists: false,
      upcoming: [],
    });
  }

  const now = new Date();

  const upcoming = await prisma.bonusDrop.findMany({
    where: {
      drawId: draw.id,
      status: 'SCHEDULED',
      scheduledAt: { gt: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    drawExists: true,
    drawId: draw.id,
    upcoming,
    now: now.toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Body;

  const amountXpotNum = Number(body.amountXpot);
  if (!Number.isFinite(amountXpotNum) || amountXpotNum <= 0) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_AMOUNT' },
      { status: 400 },
    );
  }

  const label = (body.label ?? '').toString().trim() || 'Bonus XPOT';

  // Decide scheduled time
  let scheduledAt: Date;

  // 1) explicit scheduledAt wins
  if (body.scheduledAt) {
    const d = new Date(body.scheduledAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_SCHEDULED_AT' },
        { status: 400 },
      );
    }
    scheduledAt = d;
  } else {
    // 2) accept delayMinutes (UI) OR minutesFromNow (legacy)
    const rawMins =
      body.delayMinutes ?? body.minutesFromNow;

    const mins = Number(rawMins);

    if (!Number.isFinite(mins)) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_DELAY_MINUTES' },
        { status: 400 },
      );
    }

    // ✅ hard allowlist, no silent fallback to 15
    if (!ALLOWED_MINUTES.includes(mins as any)) {
      return NextResponse.json(
        {
          ok: false,
          error: `INVALID_DELAY_MINUTES_ALLOWED_${ALLOWED_MINUTES.join('_')}`,
        },
        { status: 400 },
      );
    }

    scheduledAt = new Date(Date.now() + mins * 60 * 1000);
  }

  const drawDate = todayUtcStart();

  // Ensure today's draw exists
  const draw = await prisma.draw.upsert({
    where: { drawDate },
    update: {},
    create: {
      drawDate,
      status: 'open',
      closesAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    },
  });

  const drop = await prisma.bonusDrop.create({
    data: {
      drawId: draw.id,
      label,
      amountXpot: Math.round(amountXpotNum),
      scheduledAt,
      status: 'SCHEDULED',
    },
  });

  return NextResponse.json({
    ok: true,
    drop,
  });
}
