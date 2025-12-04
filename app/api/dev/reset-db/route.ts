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
      // Order matters: balances -> tickets -> wallets -> draws -> users
      prisma.xpUserBalance.deleteMany(), // model XpUserBalance
      prisma.ticket.deleteMany(),
      prisma.wallet.deleteMany(),
      prisma.draw.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // 🧪 2) Seed a fresh minimal state
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.create({
      data: {
        drawDate: new Date(`${todayStr}T00:00:00.000Z`),
        isClosed: false,       // matches your Draw model
        jackpotUsd: 1_000_000, // simple fixed jackpot for dev
        // closesAt: you can add this if you want a countdown:
        // closesAt: new Date(`${todayStr}T23:59:59.000Z`),
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
