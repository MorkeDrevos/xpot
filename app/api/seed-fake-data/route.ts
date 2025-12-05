// app/api/dev/seed-fake-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export async function POST(req: NextRequest) {
  // 🔒 Never allow seeding in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'SEED_DISABLED_IN_PROD' },
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
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    // 🧹 Clear existing data first to avoid weird states
    await prisma.$transaction([
      prisma.ticket.deleteMany(),
      prisma.xpUserBalance.deleteMany(),
      prisma.wallet.deleteMany(),
      prisma.draw.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // 👤 One fake user with X handle + wallet
    const user = await prisma.user.create({
      data: {
        xId: '1234567890',
        xHandle: 'fake_xpot_whale',
        xName: 'XPOT Test Whale',
        xAvatarUrl: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png',
      },
    });

    const wallet = await prisma.wallet.create({
      data: {
        address: 'FAKE_WALLET_FOR_DEV_123',
        userId: user.id,
      },
    });

    // 🧪 Completed draw for yesterday with a winner
    const yesterdayDraw = await prisma.draw.create({
      data: {
        drawDate: yesterday,
        status: 'completed',
        jackpotUsd: 1500,
        rolloverUsd: 0,
        closesAt: new Date(yesterday.getTime() + 23 * 60 * 60 * 1000),
        tickets: {
          create: [
            {
              code: 'XPOT-AAA111',
              walletAddress: wallet.address,
              status: 'won',
            },
            {
              code: 'XPOT-BBB222',
              walletAddress: wallet.address,
              status: 'expired',
            },
          ],
        },
      },
      include: { tickets: true },
    });

    // 🧪 Open draw for today with a few tickets in the pool
    const todayDraw = await prisma.draw.create({
      data: {
        drawDate: today,
        status: 'open',
        jackpotUsd: 2424.47,
        rolloverUsd: 0,
        closesAt: new Date(now.getTime() + 6 * 60 * 60 * 1000), // closes in 6h
        tickets: {
          create: [
            {
              code: 'XPOT-DEV001',
              walletAddress: wallet.address,
              status: 'in-draw',
            },
            {
              code: 'XPOT-DEV002',
              walletAddress: wallet.address,
              status: 'in-draw',
            },
          ],
        },
      },
    });

    return NextResponse.json({
      ok: true,
      user,
      wallet,
      yesterdayDrawId: yesterdayDraw.id,
      todayDrawId: todayDraw.id,
    });
  } catch (err) {
    console.error('DEV SEED ERROR', err);
    return NextResponse.json(
      { ok: false, error: 'SEED_FAILED' },
      { status: 500 }
    );
  }
}
