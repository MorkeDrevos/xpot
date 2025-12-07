// app/api/me/sync-x/route.ts
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Make sure this route is always "live", not cached
export const dynamic = 'force-dynamic';

export async function POST() {
  // In your project auth() is async -> await it
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });
  }

  // ✅ clerkClient is a function in your setup, call it to get the real client
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);

  // Find linked X / Twitter account
  const xAccount = user.externalAccounts?.find((acc) => {
    const provider = (acc.provider as string | undefined) ?? '';
    return (
      provider === 'oauth_x' ||
      provider === 'twitter' ||
      provider === 'oauth_twitter'
    );
  });

  if (!xAccount) {
    return NextResponse.json(
      { ok: false, error: 'NO_X_ACCOUNT' },
      { status: 400 }
    );
  }

  const handle = xAccount.username || null;
  const avatar = xAccount.imageUrl || null;
  const name   = user.fullName || handle || null;
  const xId    = xAccount.id || null;

  // Upsert into your Prisma User table
  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    create: {
      clerkId: userId,
      xId,
      xHandle: handle,
      xAvatarUrl: avatar,
      xName: name,
    },
    update: {
      xId,
      xHandle: handle,
      xAvatarUrl: avatar,
      xName: name,
    },
  });

  return NextResponse.json({ ok: true, user: dbUser });
}
