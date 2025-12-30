// lib/ensureActiveDraw.ts
import { prisma } from '@/lib/prisma';

const DAY_MS = 86_400_000;

// UTC day start (00:00:00.000Z)
function utcDayStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function utcDayEndExclusive(d: Date) {
  return new Date(utcDayStart(d).getTime() + DAY_MS);
}

function computeClosesAtForDay(dayUtcStart: Date) {
  const hour = Number(process.env.XPOT_DAILY_CLOSE_UTC_HOUR ?? 21);
  const min = Number(process.env.XPOT_DAILY_CLOSE_UTC_MIN ?? 0);

  return new Date(
    Date.UTC(
      dayUtcStart.getUTCFullYear(),
      dayUtcStart.getUTCMonth(),
      dayUtcStart.getUTCDate(),
      hour,
      min,
      0,
      0,
    ),
  );
}

type DrawLite = {
  id: string;
  drawDate: Date;
  closesAt: Date | null;
  status: string | null;
};

export async function ensureActiveDraw(date: Date = new Date()): Promise<DrawLite> {
  const todayUtcStart = utcDayStart(date);
  const tomorrowUtcStart = utcDayEndExclusive(todayUtcStart);
  const closesAt = computeClosesAtForDay(todayUtcStart);

  // Find by range (robust even if drawDate isn't exactly midnight in DB)
  const existing = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: todayUtcStart,
        lt: tomorrowUtcStart,
      },
    },
    orderBy: { drawDate: 'asc' },
    select: {
      id: true,
      drawDate: true,
      closesAt: true,
      status: true,
    },
  });

  // Create if missing
  if (!existing) {
    return (await prisma.draw.create({
      data: {
        drawDate: todayUtcStart,
        closesAt,
        status: 'open',
      } as any,
      select: {
        id: true,
        drawDate: true,
        closesAt: true,
        status: true,
      },
    })) as unknown as DrawLite;
  }

  // Patch closesAt if missing
  if (!existing.closesAt) {
    return (await prisma.draw.update({
      where: { id: existing.id },
      data: { closesAt },
      select: {
        id: true,
        drawDate: true,
        closesAt: true,
        status: true,
      },
    })) as unknown as DrawLite;
  }

  return existing as unknown as DrawLite;
}
