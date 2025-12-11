// app/api/bonus/upcoming/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    // Optional: limit to today only
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const drop = await prisma.bonusDrop.findFirst({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          gte: now,
          lte: endOfDay,
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    if (!drop) {
      return NextResponse.json({ ok: true, upcoming: null });
    }

    return NextResponse.json({
      ok: true,
      upcoming: {
        id: drop.id,
        amountXpot: drop.amountXpot,
        scheduledFor: drop.scheduledFor.toISOString(),
      },
    });
  } catch (err) {
    console.error('[BONUS] /bonus/upcoming error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LOAD_BONUS' },
      { status: 500 },
    );
  }
}
