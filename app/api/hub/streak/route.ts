// app/api/hub/streak/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function utcStartOfDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function isSameUtcDay(a?: Date | null, b?: Date | null) {
  if (!a || !b) return false;
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });

    const row = await prisma.hubStreak.upsert({
      where: { clerkId },
      create: { clerkId, days: 0, lastDoneDay: null },
      update: {},
      select: { days: true, lastDoneDay: true },
    });

    const today = utcStartOfDay();
    const todayDone = isSameUtcDay(row.lastDoneDay, today);

    return NextResponse.json(
      {
        ok: true,
        streak: {
          days: row.days,
          todayDone,
          lastDoneYmd: row.lastDoneDay ? row.lastDoneDay.toISOString().slice(0, 10) : null,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /api/hub/streak GET error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });

    const today = utcStartOfDay();

    const current = await prisma.hubStreak.upsert({
      where: { clerkId },
      create: { clerkId, days: 0, lastDoneDay: null },
      update: {},
      select: { id: true, days: true, lastDoneDay: true },
    });

    if (isSameUtcDay(current.lastDoneDay, today)) {
      return NextResponse.json(
        { ok: true, streak: { days: current.days, todayDone: true, lastDoneYmd: today.toISOString().slice(0, 10) } },
        { status: 200 },
      );
    }

    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const nextDays = isSameUtcDay(current.lastDoneDay, yesterday) ? current.days + 1 : 1;

    const updated = await prisma.hubStreak.update({
      where: { id: current.id },
      data: { days: nextDays, lastDoneDay: today },
      select: { days: true, lastDoneDay: true },
    });

    return NextResponse.json(
      {
        ok: true,
        streak: {
          days: updated.days,
          todayDone: true,
          lastDoneYmd: updated.lastDoneDay ? updated.lastDoneDay.toISOString().slice(0, 10) : null,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /api/hub/streak POST error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
