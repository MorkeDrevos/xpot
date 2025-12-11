// app/api/bonus/upcoming/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    // We'll limit "upcoming" to *today* – between now and end of day (UTC)
    const endOfDay = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const drop = await prisma.bonusDrop.findFirst({
      where: {
        status: 'SCHEDULED',       // Prisma enum: BonusDropStatus
        scheduledAt: {
          gte: now,                // not fired yet
          lte: endOfDay,           // still today
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    if (!drop) {
      return NextResponse.json({ ok: true, upcoming: null });
    }

    const upcoming = {
      id: drop.id,
      label: drop.label,
      amountXpot: drop.amountXpot,
      scheduledAt: drop.scheduledAt.toISOString(),
      status: drop.status,
    };

    return NextResponse.json({ ok: true, upcoming });
  } catch (err) {
    console.error('[BONUS] /bonus/upcoming error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LOAD_BONUS' },
      { status: 500 },
    );
  }
}
