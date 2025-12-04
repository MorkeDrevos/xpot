// app/api/dev/reset-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Shared handler used by both GET and POST
async function handleReset(req: NextRequest) {
  // Only allow on dev.xpot.bet (or localhost)
  const host = req.nextUrl.hostname;
  const isDevHost =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('dev.');

  if (!isDevHost) {
    return NextResponse.json(
      { ok: false, error: 'RESET_DISABLED_ON_THIS_HOST' },
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
    // 🧹 1) Clear everything – include legacy Reward table first
    await prisma.$transaction([
      // Legacy table that still has FK to Ticket; ignore if empty
      prisma.$executeRawUnsafe(`DELETE FROM "Reward";`),

      // Your current models, children first → parents last
      prisma.xpUserBalance.deleteMany(),
      prisma.ticket.deleteMany(),
      prisma.wallet.deleteMany(),
      prisma.draw.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // 🧪 2) Seed a fresh minimal Draw for today
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const draw = await prisma.draw.create({
      data: {
        drawDate: new Date(`${todayStr}T00:00:00.000Z`),
        // status + isClosed come from Prisma defaults
        jackpotUsd: 1_000_000,
      },
    });

    return NextResponse.json({
      ok: true,
      cleared: true,
      seeded: true,
      drawId: draw.id,
    });
  } catch (err: any) {
    console.error('DEV_RESET_ERROR', err);
    return NextResponse.json(
      {
        ok: false,
        // Show the actual DB / Prisma error so you can see it in the browser
        error: err?.message || 'RESET_FAILED',
      },
      { status: 500 },
    );
  }
}

// Allow both GET (for browser) and POST (for curl/tools)
export async function GET(req: NextRequest) {
  return handleReset(req);
}

export async function POST(req: NextRequest) {
  return handleReset(req);
}
