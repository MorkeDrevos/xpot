// app/api/dev/reset-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  const expected = process.env.DEV_RESET_SECRET || 'xpot-dev-reset';

  // Extra safety: environment flag for prod resets
  const allowProdReset = process.env.ALLOW_PROD_RESET === '1';

  // 🔒 Block in prod unless ALLOW_PROD_RESET=1
  if (process.env.NODE_ENV === 'production' && !allowProdReset) {
    return NextResponse.json(
      { ok: false, error: 'RESET_DISABLED_IN_PROD' },
      { status: 403 }
    );
  }

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

    // If you already had seeding logic here in dev, keep it:
    // await seedDemoData(prisma);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[XPOT] RESET-DB FAILED', err);
    return NextResponse.json(
      { ok: false, error: 'RESET_FAILED' },
      { status: 500 }
    );
  }
}
