// app/api/dev/reset-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 🔒 Never allow reset in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'RESET_DISABLED_IN_PROD' },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  const expected = process.env.DEV_RESET_SECRET || 'xpot-dev-reset';

  if (secret !== expected) {
    return NextResponse.json(
      { ok: false, error: 'BAD_SECRET' },
      { status: 401 }
    );
  }

  try {
    // 🧹 Clear DB in correct dependency order
    await prisma.$transaction([
      prisma.ticket.deleteMany(),
      prisma.xpUserBalance.deleteMany(),
      prisma.wallet.deleteMany(),
      prisma.draw.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    const today = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.create({
      data: {
        drawDate: new Date(`${today}T00:00:00.000Z`),
        isClosed: false,
        jackpotUsd: 1_000_000,
      },
    });

    return NextResponse.json({
      ok: true,
      cleared: true,
      seeded: true,
      drawId: draw.id,
    });

  } catch (err) {
    console.error('DEV RESET FAILED:', err);
    return NextResponse.json(
      { ok: false, error: 'RESET_FAILED' },
      { status: 500 }
    );
  }
}
