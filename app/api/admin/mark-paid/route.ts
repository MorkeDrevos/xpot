// app/api/admin/mark-paid/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { winnerId, txUrl } = await req.json();

    if (!winnerId || typeof winnerId !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'INVALID_WINNER_ID' },
        { status: 400 },
      );
    }

    if (!txUrl || typeof txUrl !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'INVALID_TX_URL' },
        { status: 400 },
      );
    }

    const winner = await prisma.winner.update({
      where: { id: winnerId },
      data: {
        isPaidOut: true,
        txUrl,
      },
    });

    return NextResponse.json({ ok: true, winner });
  } catch (err: any) {
    console.error('[ADMIN] /mark-paid error', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'FAILED_TO_MARK_PAID' },
      { status: 500 },
    );
  }
}
