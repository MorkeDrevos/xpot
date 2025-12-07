import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  // ✅ FIX: auth() must be awaited
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });
  }

  const user = await clerkClient.users.getUser(userId);

  const xAccount = user.externalAccounts.find(
    (acc) => acc.provider === 'oauth_x'
  );

  if (!xAccount) {
    return NextResponse.json({ ok: false, error: 'NO_X_ACCOUNT' }, { status: 400 });
  }

  const handle = xAccount.username || null;
  const avatar = xAccount.imageUrl || null;
  const name    = user.fullName || handle || null;

  // ✅ UPSERT user (create if not exists, update if exists)
  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    create: {
      clerkId: userId,
      xId: xAccount.id,
      xHandle: handle,
      xAvatarUrl: avatar,
      xName: name,
    },
    update: {
      xHandle: handle,
      xAvatarUrl: avatar,
      xName: name,
    },
  });

  return NextResponse.json({ ok: true, user: dbUser });
}
