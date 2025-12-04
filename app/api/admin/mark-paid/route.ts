// app/api/admin/mark-paid/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const winnerId = body?.winnerId as string | undefined;
    const txUrl = (body?.txUrl as string | undefined) || null;

    if (!winnerId) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_WINNER_ID' },
        { status: 400 },
      );
    }

    // 🔴 IMPORTANT: use your real model name here.
    // If your prisma schema has `model Reward { ... }`,
    // this should be prisma.reward.update(...)
    const updated = await prisma.reward.update({
      where: { id: winnerId },
      data: {
        isPaidOut: true,
        txUrl,
      },
    });

    return NextResponse.json({
      ok: true,
      winner: {
        id: updated.id,
        isPaidOut: updated.isPaidOut,
        txUrl: updated.txUrl,
      },
    });
  } catch (err: any) {
    console.error('[ADMIN] /mark-paid error', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'FAILED_TO_MARK_PAID',
      },
      { status: 500 },
    );
  }
}
