export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    // Pick the next scheduled bonus in the future
    const next = await prisma.bonusDrop.findFirst({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gt: now },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    if (!next) {
      return NextResponse.json({ bonus: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        bonus: {
          id: next.id,
          label: next.label ?? 'Bonus XPOT',
          amountXpot: Number(next.amountXpot ?? 0),
          scheduledAt: next.scheduledAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error('[api/bonus/upcoming] error', e);
    return NextResponse.json({ bonus: null }, { status: 200 });
  }
}
