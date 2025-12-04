// app/api/dev/reset-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Shared handler used by both GET and POST in dev
async function handleReset(req: NextRequest) {
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
    // 🧹 1) Clear everything – children first, then parents
    await prisma.$transaction([
      prisma.xpUserBalance.deleteMany(), // depends on Wallet
      prisma.ticket.deleteMany(),        // depends on Draw, User, Wallet
      prisma.wallet.deleteMany(),        // depends on User
      prisma.draw.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // 🧪 2) Seed a fresh minimal Draw for today
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const draw = await prisma.draw.create({
      data: {
        drawDate: new Date(`${todayStr}T00:00:00.000Z`),
        status: 'OPEN',       // DrawStatus enum
        isClosed: false,
        jackpotUsd: 1_000_000,
        // closesAt: new Date(`${todayStr}T23:59:59.000Z`), // optional
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

// Allow both POST (for tools) and GET (for you in the browser) in dev
export async function POST(req: NextRequest) {
  return handleReset(req);
}

export async function GET(req: NextRequest) {
  return handleReset(req);
}
