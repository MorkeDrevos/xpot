// app/api/bonus/live/route.ts
import { NextResponse } from 'next/server';

// If your prisma client is default-exported, use:
// import prisma from '@/lib/prisma';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function utcDayStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

export async function GET() {
  const today = utcDayStart(new Date());

  // Find today's draw (your schema uses drawDate as a UTC day bucket)
  const draw = await prisma.draw.findUnique({
    where: { drawDate: today },
    select: {
      bonusDrops: {
        where: {
          // Only show active + fired. Hide cancelled.
          status: { in: ['SCHEDULED', 'FIRED'] },
        },
        orderBy: { scheduledAt: 'asc' },
        select: {
          id: true,
          amountXpot: true,
          scheduledAt: true,
          status: true,
          label: true,
        },
      },
    },
  });

  const bonus =
    draw?.bonusDrops?.map(b => ({
      id: b.id,
      amountXpot: b.amountXpot,
      scheduledAt: b.scheduledAt.toISOString(),
      // UI expects: UPCOMING | CLAIMED
      status: b.status === 'FIRED' ? 'CLAIMED' : 'UPCOMING',
      // optional (safe to include; frontend can ignore)
      label: b.label ?? null,
    })) ?? [];

  return NextResponse.json(
    { bonus },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
