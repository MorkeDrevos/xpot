// app/api/db-test/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // simple raw query just to prove connection works
    const result = await prisma.$queryRawUnsafe<{ now: Date }[]>(
      'SELECT NOW() as now'
    );

    return NextResponse.json({
      ok: true,
      now: result[0]?.now ?? null,
    });
  } catch (error) {
    console.error('DB test error:', error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
