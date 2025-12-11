// lib/ensureTodayDraw.ts
import { prisma } from '@/lib/prisma';

function getTodayRange() {
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const start = new Date(`${todayStr}T00:00:00.000Z`);
  const end = new Date(`${todayStr}T23:59:59.999Z`);
  return { start, end };
}

export async function ensureTodayDraw() {
  const { start, end } = getTodayRange();

  // Check if today's draw already exists
  const existing = await prisma.draw.findFirst({
    where: {
      drawDate: { gte: start, lt: end },
    },
  });

  if (existing) {
    return existing;
  }

  // Create a fresh "open" draw for today
  const created = await prisma.draw.create({
    data: {
      drawDate: start,
      status: 'open',
      closesAt: end,
    },
  });

  return created;
}
