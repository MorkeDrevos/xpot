// app/api/dev/reset-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 🚫 Hard stop on real production
  if (
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production')
  ) {
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
    console.log('🧹 Reset start…');

    // Child → Parent order
    console.log('Delete tickets');
    await prisma.ticket.deleteMany();

    console.log('Delete balances');
    await prisma.xpUserBalance.deleteMany();

    console.log('Delete wallets');
    await prisma.wallet.deleteMany();

    console.log('Delete draws');
    await prisma.draw.deleteMany();

    console.log('Delete users');
    await prisma.user.deleteMany();

    console.log('✅ Tables cleared');

    const todayStr = new Date().toISOString().slice(0, 10);

    console.log('🌱 Creating seed draw');

    const draw = await prisma.draw.create({
      data: {
        drawDate: new Date(`${todayStr}T00:00:00.000Z`),
        isClosed: false,
        jackpotUsd: 1_000_000,
      },
    });

    console.log('✅ Seed complete');

    return NextResponse.json({
      ok: true,
      cleared: true,
      seeded: true,
      drawId: draw.id,
    });

  } catch (err: any) {
    console.error('🔥 RESET FAILED', err);

    return NextResponse.json(
      {
        ok: false,
        error: 'RESET_FAILED',
        detail: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
