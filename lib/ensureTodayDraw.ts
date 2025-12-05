// lib/ensureTodayDraw.ts
import { prisma } from '@/lib/prisma';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export async function ensureTodayDraw() {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  // 1) If today’s draw exists -> just return it
  const existing = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (existing) return existing;

  // 2) No draw today – check last draw
  const lastDraw = await prisma.draw.findFirst({
    orderBy: { drawDate: 'desc' },
  });

  // If there's no previous draw, or last one is still open/closed, don't auto-create
  if (!lastDraw) {
    // first ever draw
    return prisma.draw.create({
      data: {
        drawDate: today,
        status: 'open',
        jackpotUsd: 1000,      // default / config
        rolloverUsd: 0,
        closesAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });
  }

  if (
    lastDraw.status !== 'completed' ||
    !lastDraw.closesAt ||
    lastDraw.closesAt > now
  ) {
    // last draw not finished yet -> don’t start new one
    return null;
  }

  // 3) Last draw is completed and closed in the past -> create next one
  return prisma.draw.create({
    data: {
      drawDate: today,
      status: 'open',
      jackpotUsd: lastDraw.jackpotUsd, // or baseJackpot + rollover, tweak to your logic
      rolloverUsd: lastDraw.rolloverUsd,
      closesAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  });
}
