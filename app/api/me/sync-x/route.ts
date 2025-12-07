// app/api/me/sync-x/route.ts
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  // ✅ auth() is async in your setup – we must await it
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTH' },
      { status: 401 },
    );
  }

  // ✅ clerkClient is an object, not a function
  const user = await clerkClient.users.getUser(userId);

  // Find the linked X / Twitter account
  const xAccount = user.externalAccounts?.find((acc) => {
    const provider = acc.provider as unknown as string;
    return provider === 'oauth_x' || provider === 'oauth_twitter';
  });

  if (!xAccount) {
    return NextResponse.json(
      { ok: false, error: 'NO_X_ACCOUNT' },
      { status: 400 },
    );
  }

  const handle = xAccount.username || null;
  const avatar = xAccount.imageUrl || null;
  const name = user.fullName || handle || null;
  const xId = xAccount.id || null;

  // Make sure your Prisma User model has: clerkId, xId, xHandle, xAvatarUrl, xName
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
