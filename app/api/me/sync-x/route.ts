// app/api/me/sync-x/route.ts
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  // Clerk auth – no need to await
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTH' },
      { status: 401 },
    );
  }

  // Load Clerk user
  const user = await clerkClient.users.getUser(userId);

  // Be forgiving when detecting the X account
  const externalAccounts = (user.externalAccounts || []) as any[];

  const xAccount =
    externalAccounts.find((acc) => {
      const provider = (acc.provider ?? '') as string;
      return (
        provider === 'oauth_x' ||
        provider === 'oauth_twitter' ||
        provider === 'twitter' ||
        provider.toLowerCase().includes('twitter') ||
        provider.toLowerCase().includes('x')
      );
    }) || externalAccounts[0];

  if (!xAccount) {
    return NextResponse.json(
      { ok: false, error: 'NO_X_ACCOUNT' },
      { status: 400 },
    );
  }

  const handle =
    xAccount.username ||
    xAccount.screenName ||
    null;

  const avatar = xAccount.imageUrl || user.imageUrl || null;
  const name = user.fullName || handle || null;

  // Use xId (unique in your Prisma schema) as the upsert key
  const dbUser = await prisma.user.upsert({
    where: { xId: xAccount.id },
    create: {
      xId: xAccount.id,
      xHandle: handle ?? undefined,
      xAvatarUrl: avatar ?? undefined,
      xName: name ?? undefined,
    },
    update: {
      xHandle: handle ?? undefined,
      xAvatarUrl: avatar ?? undefined,
      xName: name ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, user: dbUser });
}
