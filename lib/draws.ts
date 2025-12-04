// lib/draws.ts
import { prisma } from './prisma';

/**
 * Helper: returns UTC start/end of "today" as used by XPOT.
 */
export function getTodayRange() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  return { startOfDay, endOfDay };
}

/**
 * Helper: fetch today's draw including tickets + wallet relation.
 * If there are multiple draws for today (buggy state), it:
 *   - logs a warning with all IDs
 *   - returns the latest one by drawDate
 */
export async function getTodayDrawWithTickets() {
  const { startOfDay, endOfDay } = getTodayRange();

  const draws = await prisma.draw.findMany({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    orderBy: {
      drawDate: 'asc',
    },
    include: {
      tickets: {
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
        },
      },
    },
  });

  if (!draws.length) {
    return null;
  }

  if (draws.length > 1) {
    console.warn('[XPOT] Multiple draws found for today', {
      ids: draws.map((d) => d.id),
      dates: draws.map((d) => d.drawDate),
    });
  }

  // Use the latest draw for today
  return draws[draws.length - 1];
}
