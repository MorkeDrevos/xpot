// app/api/admin/bonus-schedule/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

function todayUtcStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

type Body = {
  amountXpot?: number;
  label?: string;
  minutesFromNow?: number; // preferred for UI buttons (5/15/30/60)
  scheduledAt?: string;    // optional ISO override
};

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const amountXpot = Number(body.amountXpot ?? 0);
    if (!Number.isFinite(amountXpot) || amountXpot <= 0) {
      return NextResponse.json(
        { ok: false, error: 'BAD_AMOUNT' },
        { status: 400 },
      );
    }

    const label = String(body.label ?? 'Scheduled Bonus XPOT').slice(0, 80);

    let scheduledAt: Date;
    if (body.scheduledAt) {
      scheduledAt = new Date(body.scheduledAt);
    } else {
      const mins = Math.max(1, Number(body.minutesFromNow ?? 15));
      scheduledAt = new Date(Date.now() + mins * 60 * 1000);
    }

    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { ok: false, error: 'BAD_SCHEDULED_AT' },
        { status: 400 },
      );
    }

    // Ensure today's draw exists
    const drawDate = todayUtcStart();
    const draw = await prisma.draw.upsert({
      where: { drawDate },
      update: {},
      create: {
        drawDate,
        status: 'open',
        closesAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
      select: { id: true, drawDate: true },
    });

    const drop = await prisma.bonusDrop.create({
      data: {
        drawId: draw.id,
        label,
        amountXpot: Math.floor(amountXpot),
        scheduledAt,
        status: 'SCHEDULED',
      },
      select: {
        id: true,
        label: true,
        amountXpot: true,
        scheduledAt: true,
        status: true,
      },
    });

    return NextResponse.json({
      ok: true,
      drop: {
        id: drop.id,
        label: drop.label,
        amountXpot: drop.amountXpot,
        scheduledAt: drop.scheduledAt.toISOString(),
        status: drop.status,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'BONUS_SCHEDULE_FAILED', message: String(e?.message || e) },
      { status: 500 },
    );
  }
}
