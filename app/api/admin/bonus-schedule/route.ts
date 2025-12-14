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

type Body = {
  amountXpot?: number | string;
  label?: string;
  minutesFromNow?: number | string; // optional
  scheduledAt?: string; // optional ISO, overrides minutesFromNow if present
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

  const label =
    (body.label ?? '').toString().trim() || 'Bonus XPOT';

  // Decide scheduled time
  let scheduledAt: Date | null = null;

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
    const mins = Number(body.minutesFromNow ?? 15);
    const safeMins = Number.isFinite(mins) ? Math.max(1, Math.min(24 * 60, mins)) : 15;
    scheduledAt = new Date(Date.now() + safeMins * 60 * 1000);
  }

  const drawDate = todayUtcStart();

  // Ensure today's draw exists (and matches your Ops page concept of "today")
  const draw = await prisma.draw.upsert({
    where: { drawDate },
    update: {},
    create: {
      drawDate,
      status: 'open',
      closesAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    },
  });

  // Write REAL DB row and return it (this is what your UI needs)
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
