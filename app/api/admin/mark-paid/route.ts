// app/api/admin/mark-paid/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Admin guard
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const winnerId = body.winnerId as string | undefined;

    if (!winnerId || typeof winnerId !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'MISSING_OR_INVALID_WINNER_ID' },
        { status: 400 },
      );
    }

    // Update the Winner record – mark as paid out
    const updated = await prisma.winner.update({
      where: { id: winnerId },
      data: {
        isPaidOut: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        winner: {
          id: updated.id,
          kind: updated.kind,
          isPaidOut: updated.isPaidOut,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /admin/mark-paid error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
