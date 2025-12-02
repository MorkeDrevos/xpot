// app/api/draw/today/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // <- uses the named export

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const draw = await prisma.draw.findFirst({
      where: {
        // adjust if your model uses a different field name than `date`
        date: today,
      },
      select: {
        id: true,
        date: true,
        status: true,
        closesAt: true,
        jackpotUsd: true,
        rolloverUsd: true,
        ticketsCount: true,
      },
    });

    if (!draw) {
      return NextResponse.json({ ok: false, error: 'NO_DRAW' });
    }

    return NextResponse.json({ ok: true, draw });
  } catch (err) {
    console.error('[XPOT] /api/draw/today error:', err);
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
