// app/api/bonus/live/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type BonusRow = {
  id: string;
  amountXpot: number;
  scheduledAt: Date | string;
  status: 'UPCOMING' | 'CLAIMED' | string;
};

async function getPrisma() {
  // Supports either:
  //   export default prisma
  // or:
  //   export const prisma = new PrismaClient()
  try {
    const mod: any = await import('@/lib/prisma');
    return (mod?.prisma ?? mod?.default ?? null) as any;
  } catch {
    return null;
  }
}

function toIso(x: Date | string) {
  const d = typeof x === 'string' ? new Date(x) : x;
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { bonus: [], source: 'db', warning: 'Prisma not available at @/lib/prisma' },
      { status: 200 }
    );
  }

  try {
    // “Live” window: show recently relevant + upcoming bonus drops.
    // (Adjust later to “today in Madrid” once you want strict-day logic.)
    const now = Date.now();
    const windowStart = new Date(now - 12 * 60 * 60 * 1000); // last 12h
    const windowEnd = new Date(now + 36 * 60 * 60 * 1000); // next 36h

    // IMPORTANT:
    // This assumes your Prisma model is named `BonusDrop`
    // with fields: id, amountXpot, scheduledAt, status
    const rows: BonusRow[] = await prisma.bonusDrop.findMany({
      where: {
        scheduledAt: { gte: windowStart, lte: windowEnd },
        // If your enum differs, loosen/remove this filter
        status: { in: ['UPCOMING', 'CLAIMED'] },
      },
      orderBy: [{ scheduledAt: 'asc' }],
      take: 25,
      select: {
        id: true,
        amountXpot: true,
        scheduledAt: true,
        status: true,
      },
    });

    return NextResponse.json({
      bonus: rows.map(r => ({
        id: r.id,
        amountXpot: Number(r.amountXpot ?? 0),
        scheduledAt: toIso(r.scheduledAt),
        status: r.status === 'CLAIMED' ? 'CLAIMED' : 'UPCOMING',
      })),
      source: 'db',
      updatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    // If your model/field names differ, you’ll see it here in the warning
    return NextResponse.json(
      {
        bonus: [],
        source: 'db',
        warning: e?.message || 'Failed to read bonus drops from DB',
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
