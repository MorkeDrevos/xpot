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
    // 🧹 1) Clear everything – adjust model names to your schema
    await prisma.$transaction([
      prisma.ticket.deleteMany(),
      prisma.wallet.deleteMany(),
      prisma.xpUserBalance?.deleteMany?.() ?? prisma.$executeRaw`SELECT 1`,
      prisma.draw.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // 🧪 2) Seed a fresh minimal state
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.create({
      data: {
        // adjust fields to your Draw model
        drawDate: new Date(`${todayStr}T00:00:00.000Z`),
        status: 'OPEN',          // or 'open' if your enum is lowercase
        jackpotXp: 1_000_000,    // rename if you use another field
        rolloverXp: 0,
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
