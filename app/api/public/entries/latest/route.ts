// app/api/public/entries/latest/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TAKE = 18;

export async function GET() {
  try {
    const draw = await prisma.draw.findFirst({
      orderBy: { drawDate: 'desc' },
      select: { id: true, drawDate: true },
    });

    if (!draw) return NextResponse.json({ ok: true, entries: [] }, { status: 200 });

    const entries = await prisma.drawEntry.findMany({
      where: { drawId: draw.id },
      orderBy: { createdAt: 'desc' },
      take: TAKE,
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
        drawId: draw.id,
        drawDate: draw.drawDate.toISOString(),
        entries: entries.map(e => ({
          id: e.id,
          createdAt: e.createdAt.toISOString(),
          handle: e.xHandle,
          name: e.xName ?? null,
          avatarUrl: e.xAvatarUrl ?? null,
          verified: Boolean(e.verified),
        })),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ ok: false, entries: [] }, { status: 200 });
  }
}
