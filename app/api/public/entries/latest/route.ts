// app/api/public/entries/latest/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Most recent draw (works even if you don’t want to “ensure today” here)
    const draw = await prisma.draw.findFirst({
      orderBy: [{ drawDate: 'desc' }],
      select: { id: true, drawDate: true },
    });

    if (!draw) {
      return NextResponse.json({ ok: true, entries: [] }, { status: 200 });
    }

    const entries = await prisma.drawEntry.findMany({
      where: { drawId: draw.id },
      orderBy: [{ createdAt: 'desc' }],
      take: 14,
      select: {
        id: true,
        createdAt: true,
        xHandle: true,
        xName: true,
        xAvatarUrl: true,
        verified: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        drawDate: draw.drawDate.toISOString(),
        entries,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ ok: false, entries: [] }, { status: 200 });
  }
}
