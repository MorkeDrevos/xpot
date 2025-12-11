// app/api/me/wallet-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const clerkId: string | undefined = body.clerkId || body.userId || undefined;
    const address: string | undefined = body.address || body.wallet || body.walletAddress;
    const handle: string | undefined = body.handle || body.xHandle || undefined;
    const name: string | undefined = body.name || body.xName || undefined;
    const avatar: string | undefined = body.avatar || body.xAvatarUrl || undefined;
    const xUserId: string | undefined = body.xUserId || body.x_id || undefined;

    if (!address) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_WALLET_ADDRESS' },
        { status: 400 },
      );
    }

    // Find existing wallet
    const existingWallet = await prisma.wallet.findUnique({
      where: { address },
      include: { user: true },
    });

    let user;

    if (existingWallet?.user) {
      // Update user attached to this wallet
      user = await prisma.user.update({
        where: { id: existingWallet.user.id },
        data: {
          clerkId: clerkId ?? existingWallet.user.clerkId,
          xUserId: xUserId ?? existingWallet.user.xUserId,
          xHandle: handle ?? existingWallet.user.xHandle,
          xName: name ?? existingWallet.user.xName,
          xAvatarUrl: avatar ?? existingWallet.user.xAvatarUrl,
        },
      });
    } else {
      // Need a user
      // Try match by clerkId or xUserId
      const foundUser = await prisma.user.findFirst({
        where: {
          OR: [
            clerkId ? { clerkId } : undefined,
            xUserId ? { xUserId } : undefined,
            handle ? { xHandle: handle } : undefined,
          ].filter(Boolean) as any,
        },
      });

      if (foundUser) {
        user = await prisma.user.update({
          where: { id: foundUser.id },
          data: {
            clerkId: clerkId ?? foundUser.clerkId,
            xUserId: xUserId ?? foundUser.xUserId,
            xHandle: handle ?? foundUser.xHandle,
            xName: name ?? foundUser.xName,
            xAvatarUrl: avatar ?? foundUser.xAvatarUrl,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            clerkId: clerkId ?? null,
            xUserId: xUserId ?? null,
            xHandle: handle ?? null,
            xName: name ?? null,
            xAvatarUrl: avatar ?? null,
          },
        });
      }

      // Create wallet pointing to this user
      await prisma.wallet.upsert({
        where: { address },
        update: { userId: user.id },
        create: {
          address,
          userId: user.id,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        wallet: address,
        user: {
          id: user.id,
          clerkId: user.clerkId,
          xUserId: user.xUserId,
          xHandle: user.xHandle,
          xName: user.xName,
          xAvatarUrl: user.xAvatarUrl,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /me/wallet-sync error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
