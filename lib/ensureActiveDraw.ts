// lib/ensureActiveDraw.ts
import { prisma } from '@/lib/prisma';

const DAY_MS = 86_400_000;

function utcDayStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
}

function utcDayEndExclusive(dayStart: Date) {
  return new Date(dayStart.getTime() + DAY_MS);
}

/**
 * Close time for the draw-day expressed in UTC.
 * Defaults to 22:00 Europe/Madrid which is usually 21:00 UTC in winter, 20:00 UTC in summer,
 * but we keep it configurable via env as UTC clock.
 */
function computeClosesAtForDay(dayUtcStart: Date) {
  const hour = Number(process.env.XPOT_DAILY_CLOSE_UTC_HH ?? 21);
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
  const todayStart = utcDayStart(date);
  const tomorrowStart = utcDayEndExclusive(todayStart);
  const closesAt = computeClosesAtForDay(todayStart);

  // Find the draw by day range (robust even if drawDate isn't exactly midnight in DB)
  const existing = await prisma.draw.findFirst({
    where: {
      drawDate: { gte: todayStart, lt: tomorrowStart },
    },
    orderBy: { drawDate: 'asc' },
    select: { id: true, drawDate: true, closesAt: true, status: true },
  });

  if (existing) {
    // Backfill closesAt if missing
    if (!existing.closesAt) {
      const updated = await prisma.draw.update({
        where: { id: existing.id },
        data: { closesAt },
        select: { id: true, drawDate: true, closesAt: true, status: true },
      });
      return updated;
    }
    return existing;
  }

  // Create a new OPEN draw for today
  const created = await prisma.draw.create({
    data: {
      drawDate: todayStart,
      closesAt,
      status: 'OPEN',
    },
    select: { id: true, drawDate: true, closesAt: true, status: true },
  });

  return created;
}
