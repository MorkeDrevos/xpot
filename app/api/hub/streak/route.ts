// app/api/hub/streak/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function utcStartOfDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isSameUtcDay(a?: Date | null, b?: Date | null) {
  if (!a || !b) return false;
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
}

export async function GET() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const row = await prisma.hubStreak.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    const today = utcStartOfDay();
    const todayDone = isSameUtcDay(row.lastDoneDay, today);

    return NextResponse.json({
      ok: true,
      streak: {
        days: row.days,
        todayDone,
        lastDoneYmd: row.lastDoneDay?.toISOString().slice(0, 10) ?? null,
      },
    });
  } catch (err: any) {
    console.error('[XPOT] hub streak GET error', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const today = utcStartOfDay();

    const current = await prisma.hubStreak.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    if (isSameUtcDay(current.lastDoneDay, today)) {
      return NextResponse.json({
        ok: true,
        streak: {
          days: current.days,
          todayDone: true,
          lastDoneYmd: today.toISOString().slice(0, 10),
        },
      });
    }

    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const nextDays = isSameUtcDay(current.lastDoneDay, yesterday)
      ? current.days + 1
      : 1;

    const updated = await prisma.hubStreak.update({
      where: { userId: user.id },
      data: {
        days: nextDays,
        lastDoneDay: today,
      },
    });

    return NextResponse.json({
      ok: true,
      streak: {
        days: updated.days,
        todayDone: true,
        lastDoneYmd: today.toISOString().slice(0, 10),
      },
    });
  } catch (err: any) {
    console.error('[XPOT] hub streak POST error', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
