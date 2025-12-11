// app/api/admin/reopen-draw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  await requireAdmin(req);

  const { searchParams } = new URL(req.url);
  const drawId = searchParams.get('id');

  if (!drawId) {
    return NextResponse.json(
      { ok: false, error: 'Missing draw id' },
      { status: 400 },
    );
  }

  const existing = await prisma.draw.findUnique({
    where: { id: drawId },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: 'Draw not found' },
      { status: 404 },
    );
  }

  const updated = await prisma.draw.update({
    where: { id: drawId },
    data: {
      // if your enum is upper-case, keep 'OPEN', otherwise use 'open'
      status: 'OPEN',
      resolvedAt: null,
      paidAt: null,
      payoutTx: null,
      // 🔹 isClosed removed – this field no longer exists in Prisma
    },
  });

  return NextResponse.json({ ok: true, draw: updated });
}
