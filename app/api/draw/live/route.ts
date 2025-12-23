// app/api/draw/live/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// UTC day bucket helper (MUST match how Draw.drawDate is written)
function utcDayStart(d: Date) {
  return new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    0, 0, 0,
  ));
}

export async function GET() {
  const today = utcDayStart(new Date());

  const draw = await prisma.draw.findUnique({
    where: { drawDate: today },
    select: {
      closesAt: true,
      status: true,
    },
  });

  if (!draw || !draw.closesAt) {
    return NextResponse.json(
      { draw: null },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }

  return NextResponse.json(
    {
      draw: {
        // canonical daily amount (already defined in lib/xpot.ts)
        jackpotXpot: 1_000_000,

        // ⚠️ IMPORTANT:
        // USD is intentionally omitted.
        // UI already derives USD from live price (correct behavior).
        closesAt: draw.closesAt.toISOString(),

        // normalize status to what UI expects
        status:
          draw.status === 'open'
            ? 'OPEN'
            : draw.status === 'completed'
            ? 'COMPLETED'
            : 'LOCKED',
      },
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
