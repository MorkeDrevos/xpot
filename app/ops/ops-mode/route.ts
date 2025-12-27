import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const provided = req.headers.get('x-xpot-admin-key');
  const expected = process.env.XPOT_OPS_ADMIN_KEY;

  if (!expected || provided !== expected) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const cfg = await prisma.opsConfig.findUnique({
    where: { singleton: 'singleton' },
  });

  return NextResponse.json({
    ok: true,
    mode: cfg?.mode ?? 'MANUAL',
  });
}
