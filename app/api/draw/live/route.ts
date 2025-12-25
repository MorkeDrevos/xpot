// app/api/draw/live/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// UTC day bucket helper (MUST match how Draw.drawDate is written)
function utcDayStart(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0),
  );
}

export async function GET() {
  try {
    const today = utcDayStart(new Date());

    const draw = await prisma.draw.findUnique({
      where: { drawDate: today },
      select: { closesAt: true, status: true },
    });

    if (!draw || !draw.closesAt) {
      return NextResponse.json(
        { draw: null },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } },
      );
    }

    // Normalize status to what UI expects
    const status =
      draw.status === 'open'
        ? 'OPEN'
        : draw.status === 'completed'
        ? 'COMPLETED'
        : 'LOCKED';

    return NextResponse.json(
      {
        draw: {
          // Canonical daily amount (UI derives USD elsewhere by live price)
          dailyXpot: 1_000_000,
          closesAt: draw.closesAt.toISOString(),
          status,
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (err) {
    console.error('[XPOT] /api/draw/live GET error:', err);
    return NextResponse.json(
      { draw: null, error: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
