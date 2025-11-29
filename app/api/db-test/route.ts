import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // simple raw query just to prove connection works
    const result = await prisma.$queryRawUnsafe(
      'SELECT NOW() as now'
    );

    // result is unknown / any, so we cast it
    const rows = result as Array<{ now: Date }>;
    const now = rows[0]?.now ?? null;

    return NextResponse.json({ ok: true, now });
  } catch (error) {
    console.error('DB test error:', error);
    return NextResponse.json(
      {
        ok: false,
        error:
          (error as Error)?.message ||
          'Unknown database error',
      },
      { status: 500 }
    );
  } finally {
    // make sure we always disconnect
    await prisma.$disconnect();
  }
}
