// app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const drawId = body?.drawId as string | undefined;
  const txUrl = (body?.txUrl as string | null | undefined) || null;

  if (!drawId) {
    return NextResponse.json(
      { ok: false, error: 'Missing drawId' },
      { status: 400 },
    );
  }

  const existing = await prisma.draw.findUnique({ where: { id: drawId } });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: 'DRAW_NOT_FOUND' },
      { status: 404 },
    );
  }

  await prisma.draw.update({
    where: { id: drawId },
    data: {
      paidAt: new Date(),
      payoutTx: txUrl,
    },
  });

  return NextResponse.json({ ok: true });
}

// Optional helper GET – just for debugging in browser
export async function GET() {
  return NextResponse.json({
    ok: false,
    error: 'Listing winners is handled by /api/admin/draw/recent-winners.',
  });
}
