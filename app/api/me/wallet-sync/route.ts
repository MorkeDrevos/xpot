// app/api/me/wallet-sync/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function normalizeAddress(addr: string) {
  return addr.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const raw = body?.address ?? body?.walletAddress ?? body?.wallet ?? null;

    const address =
      typeof raw === 'string' && raw.trim().length > 0 ? normalizeAddress(raw) : null;

    if (!address) {
      return NextResponse.json({ ok: false, error: 'MISSING_WALLET_ADDRESS' }, { status: 400 });
    }

    // Ensure a User exists for this Clerk identity
    const user = await prisma.user.upsert({
      where: { clerkId },
      create: { clerkId },
      update: {},
    });

    // If wallet already linked to another user, block it (prevents hijack)
    const existing = await prisma.wallet.findUnique({
      where: { address },
      select: { id: true, userId: true },
    });

    if (existing?.userId && existing.userId !== user.id) {
      return NextResponse.json({ ok: false, error: 'WALLET_ALREADY_LINKED' }, { status: 409 });
    }

    // Create wallet if missing, or link it to this user
    const wallet = await prisma.wallet.upsert({
      where: { address },
      create: { address, userId: user.id },
      update: { userId: user.id },
    });

    return NextResponse.json(
      {
        ok: true,
        wallet: wallet.address,
        user: { id: user.id, clerkId: user.clerkId },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /api/me/wallet-sync error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
