// app/api/dev/reset-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 🔐 Never allow this in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'RESET_DISABLED_IN_PROD' },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  const expected = process.env.DEV_RESET_SECRET || 'xpot-dev-reset';

  if (secret !== expected) {
    return NextResponse.json(
      { ok: false, error: 'BAD_SECRET' },
      { status: 401 },
    );
  }

  try {
    // 🧹 1) Clear everything – child tables first, then parents
    await prisma.$transaction([
      prisma.reward.deleteMany(),        // if Reward model exists
      prisma.ticket.deleteMany(),
      prisma.wallet.deleteMany(),
      prisma.xpUserBalance.deleteMany(),
      prisma.draw.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // 🧪 2) Seed a fresh minimal state
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.create({
      data: {
        // Adjust fields to your Draw model
        drawDate: new Date(`${todayStr}T00:00:00.000Z`),
        isClosed: false,        // matches the bool column you have in Studio
        jackpotUsd: 1_000_000,  // was jackpotXp – use the real field
        rolloverUsd: 0,         // was rolloverXp – use the real field
      },
    });

    return NextResponse.json({
      ok: true,
      cleared: true,
      seeded: true,
      drawId: draw.id,
    });
  } catch (err) {
    console.error('DEV_RESET_ERROR', err);
    return NextResponse.json(
      { ok: false, error: 'RESET_FAILED' },
      { status: 500 },
    );
  }
}
