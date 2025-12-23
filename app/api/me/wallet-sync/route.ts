// app/api/me/wallet-sync/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function isLikelySolAddress(s: string) {
  // quick sanity check (base58-ish length)
  return typeof s === 'string' && s.length >= 32 && s.length <= 64;
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'USER_NOT_SYNCED' },
        { status: 409 },
      );
    }

    const body = (await req.json().catch(() => null)) as any;
    const address = String(body?.address ?? '').trim();

    if (!isLikelySolAddress(address)) {
      return NextResponse.json({ ok: false, error: 'INVALID_WALLET' }, { status: 400 });
    }

    const wallet = await prisma.wallet.upsert({
      where: { address },
      create: {
        address,
        userId: user.id,
      },
      update: {
        // if someone re-connects, keep it linked to the current signed-in user
        userId: user.id,
      },
      select: { id: true, address: true, userId: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, wallet }, { status: 200 });
  } catch (err: any) {
    console.error('[XPOT] /api/me/wallet-sync error:', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
