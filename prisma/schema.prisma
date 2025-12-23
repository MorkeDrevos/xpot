// app/api/hub/streak/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function utcYmd(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function yesterdayYmd(todayYmd: string) {
  const d = new Date(`${todayYmd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function getOrCreateUserIdByClerkId(clerkId: string) {
  const existing = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: { clerkId },
    select: { id: true },
  });
  return created.id;
}

export async function GET() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const userId = await getOrCreateUserIdByClerkId(clerkId);
    const today = utcYmd();

    const row = await prisma.hubStreak.upsert({
      where: { userId },
      create: { userId, days: 0, lastDoneYmd: null },
      update: {},
      select: { days: true, lastDoneYmd: true },
    });

    const todayDone = row.lastDoneYmd === today;

    return NextResponse.json(
      {
        ok: true,
        streak: {
          days: row.days,
          todayDone,
          lastDoneYmd: row.lastDoneYmd ?? null,
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
    const { userId: clerkId } = auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const userId = await getOrCreateUserIdByClerkId(clerkId);
    const today = utcYmd();
    const yesterday = yesterdayYmd(today);

    const current = await prisma.hubStreak.upsert({
      where: { userId },
      create: { userId, days: 0, lastDoneYmd: null },
      update: {},
      select: { id: true, days: true, lastDoneYmd: true },
    });

    if (current.lastDoneYmd === today) {
      return NextResponse.json(
        {
          ok: true,
          streak: {
            days: current.days,
            todayDone: true,
            lastDoneYmd: today,
          },
        },
        { status: 200 },
      );
    }

    const nextDays = current.lastDoneYmd === yesterday ? current.days + 1 : 1;

    const updated = await prisma.hubStreak.update({
      where: { id: current.id },
      data: { days: nextDays, lastDoneYmd: today },
      select: { days: true, lastDoneYmd: true },
    });

    return NextResponse.json(
      {
        ok: true,
        streak: {
          days: updated.days,
          todayDone: true,
          lastDoneYmd: updated.lastDoneYmd ?? null,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /api/hub/streak POST error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
