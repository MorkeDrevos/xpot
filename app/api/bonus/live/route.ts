// app/api/bonus/live/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, BonusDropStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Prisma singleton (safe for Next/Vercel)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

type LiveBonusItem = {
  id: string;
  amountXpot: number;
  scheduledAt: string; // ISO
  status: 'UPCOMING' | 'CLAIMED' | 'CANCELLED';
  label?: string;
};

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export async function GET() {
  try {
    const now = new Date();
    const todayUtc = startOfUtcDay(now);

    // Your Draw.drawDate is a UTC day bucket (unique). This matches your schema comment.
    const draw = await prisma.draw.findUnique({
      where: { drawDate: todayUtc },
      select: {
        id: true,
        bonusDrops: {
          orderBy: { scheduledAt: 'asc' },
          select: {
            id: true,
            label: true,
            amountXpot: true,
            scheduledAt: true,
            status: true,
          },
        },
      },
    });

    const rows = draw?.bonusDrops ?? [];

    const bonus: LiveBonusItem[] = rows.map(b => {
      let status: LiveBonusItem['status'] = 'UPCOMING';

      // Map DB enum -> UI enum
      if (b.status === BonusDropStatus.CANCELLED) status = 'CANCELLED';
      else if (b.status === BonusDropStatus.FIRED) status = 'CLAIMED';
      else {
        // SCHEDULED: if time has passed, treat as "claimed/fired" visually (unless your ops later marks FIRED)
        status = b.scheduledAt.getTime() <= now.getTime() ? 'CLAIMED' : 'UPCOMING';
      }

      return {
        id: b.id,
        label: b.label ?? undefined,
        amountXpot: b.amountXpot,
        scheduledAt: b.scheduledAt.toISOString(),
        status,
      };
    });

    return NextResponse.json(
      {
        bonus,
        meta: {
          source: 'db',
          drawId: draw?.id ?? null,
          now: now.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (e) {
    // Fail closed (UI can hide the module)
    return NextResponse.json(
      { bonus: [], meta: { source: 'error' } },
      { status: 200 },
    );
  }
}
