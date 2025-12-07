// app/api/me/wallet-sync/route.ts
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

type Body = {
  address?: string;
};

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTH' },
      { status: 401 },
    );
  }

  let address: string | undefined;

  try {
    const json = (await req.json()) as Body;
    address = json.address?.trim();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'BAD_BODY' },
      { status: 400 },
    );
  }

  if (!address) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_ADDRESS' },
      { status: 400 },
    );
  }

  try {
    // Clerk client is a function in latest SDK
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    // Try to find their X account (not strictly required just to save wallet)
    const xAccount = clerkUser.externalAccounts.find((acc: any) => {
      const provider = acc.provider as string | undefined;
      return (
        provider === 'oauth_x' ||
        provider === 'oauth_twitter' ||
        provider === 'twitter'
      );
    });

    const handle = xAccount?.username || null;
    const avatar = xAccount?.imageUrl || null;
    const name = clerkUser.fullName || handle || null;

    // Make sure we have a User row for this Clerk user
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        xId: xAccount?.id || null,
        xHandle: handle,
        xAvatarUrl: avatar,
        xName: name,
      },
      update: {
        xHandle: handle ?? undefined,
        xAvatarUrl: avatar ?? undefined,
        xName: name ?? undefined,
      },
    });

    // Wire wallet → User (one row per address)
    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: {
        userId: dbUser.id,
      },
      create: {
        address,
        userId: dbUser.id,
      },
    });

    // Ensure we have a balance row (even if 0 for now)
    await prisma.xpUserBalance.upsert({
      where: { walletId: wallet.id },
      update: {},
      create: {
        walletId: wallet.id,
        balance: 0,
      },
    });

    return NextResponse.json({
      ok: true,
      walletId: wallet.id,
      userId: dbUser.id,
    });
  } catch (err) {
    console.error('[XPOT] wallet-sync failed', err);
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
