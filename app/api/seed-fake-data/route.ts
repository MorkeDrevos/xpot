import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await prisma.user.create({
      data: {
        // TEMP: no X fields until prisma client is regenerated
      },
    });

    return NextResponse.json({
      ok: true,
      userId: user.id,
    });
  } catch (err: any) {
    console.error('Seed failed', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'SEED_FAILED' },
      { status: 500 }
    );
  }
}
