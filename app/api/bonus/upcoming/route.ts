// app/api/bonus/upcoming/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const drop = await prisma.bonusDrop.findFirst({
      where: {
        status: 'SCHEDULED',
      },
      orderBy: {
        id: 'asc', // temporary fallback until we confirm the date field name
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
        scheduledFor: drop.scheduledFor ?? null, // will be null if field doesn’t exist
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
