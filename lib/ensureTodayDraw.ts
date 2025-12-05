// lib/ensureTodayDraw.ts
import { prisma } from '@/lib/prisma';

/**
 * Helper: start/end of "today" in UTC,
 * matching the style you already use in /api/admin/tickets.
 */
function getTodayRange() {
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const start = new Date(`${todayStr}T00:00:00.000Z`);
  const end = new Date(`${todayStr}T23:59:59.999Z`);
  return { start, end };
}

/**
 * Ensure there is a Draw for "today".
 *
 * - If a draw already exists for today -> returns it.
 * - If no previous draw exists at all -> creates the first one.
 * - If the latest previous draw is resolved/closed -> creates a new one for today.
 * - If the latest previous draw is still open/pending -> returns null (don’t auto-open).
 */
export async function ensureTodayDraw() {
  const { start, end } = getTodayRange();

  // 1) Does a draw already exist for today?
  const existingToday = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: start,
        lt: end,
      },
    },
  });

  if (existingToday) return existingToday;

  // 2) No draw today – look at the last draw we have
  const lastDraw = await prisma.draw.findFirst({
    orderBy: { drawDate: 'desc' },
  });

  // If no previous draws exist, create the very first one
  if (!lastDraw) {
    const created = await prisma.draw.create({
      data: {
        drawDate: start,
        isClosed: false,
        jackpotUsd: 1_000_000, // default XPOT size; tweak later if needed
      },
    });
    return created;
  }

  // If the last draw is NOT resolved/closed, don’t open a new one yet
  const lastIsCompleted = !!lastDraw.resolvedAt;
  const lastIsClosed = lastDraw.isClosed;

  if (!lastIsCompleted && !lastIsClosed) {
    // still running – bail out
    return null;
  }

  // 3) Last draw is completed/closed -> open today’s draw
  const createdToday = await prisma.draw.create({
    data: {
      drawDate: start,
      isClosed: false,
      jackpotUsd: lastDraw.jackpotUsd ?? 1_000_000,
    },
  });

  return createdToday;
}
