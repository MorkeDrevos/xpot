// app/api/bonus/upcoming/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    const next = await prisma.bonusDrop.findFirst({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: now },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const res = NextResponse.json(
      next
        ? {
            bonus: {
              id: next.id,
              label: next.label ?? 'Bonus XPOT',
              amountXpot: Number(next.amountXpot ?? 0),
              scheduledAt: next.scheduledAt.toISOString(),
              status: next.status,
            },
          }
        : { bonus: null },
      { status: 200 }
    );

    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (e) {
    console.error('[api/bonus/upcoming] error', e);
    const res = NextResponse.json({ bonus: null }, { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
