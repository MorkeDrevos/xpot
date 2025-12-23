import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function ymdUtc(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ymdUtcYesterday() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return ymdUtc(d);
}

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ ok: false, error: 'UNAUTHED' }, { status: 401 });

  const row = await prisma.hubStreak.findUnique({ where: { clerkUserId: userId } });

  const today = ymdUtc();
  const todayDone = row?.lastDoneYmd === today;

  return NextResponse.json({
    ok: true,
    streak: {
      days: row?.days ?? 0,
      todayDone,
      lastDoneYmd: row?.lastDoneYmd ?? null,
    },
  });
}

export async function POST() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ ok: false, error: 'UNAUTHED' }, { status: 401 });

  const today = ymdUtc();
  const yesterday = ymdUtcYesterday();

  const existing = await prisma.hubStreak.findUnique({ where: { clerkUserId: userId } });

  // already done today -> no change
  if (existing?.lastDoneYmd === today) {
    return NextResponse.json({
      ok: true,
      streak: {
        days: existing.days,
        todayDone: true,
        lastDoneYmd: existing.lastDoneYmd ?? null,
      },
    });
  }

  // streak rule (simple, healthy): if last done was yesterday -> +1, else reset to 1
  const nextDays =
    existing?.lastDoneYmd === yesterday ? Math.max(0, existing.days) + 1 : 1;

  const updated = await prisma.hubStreak.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId, days: nextDays, lastDoneYmd: today },
    update: { days: nextDays, lastDoneYmd: today },
  });

  return NextResponse.json({
    ok: true,
    streak: {
      days: updated.days,
      todayDone: true,
      lastDoneYmd: updated.lastDoneYmd ?? null,
    },
  });
}
