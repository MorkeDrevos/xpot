// app/api/me/sync-x/route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ ok: false, error: 'NO_USER' }, { status: 404 });
  }

  const xAccount = clerkUser.externalAccounts?.find(
    (acc: any) => acc.provider === 'oauth_x' || acc.provider === 'oauth_twitter',
  ) as any | undefined;

  const handle = xAccount?.username ?? null;
  const avatar = xAccount?.imageUrl ?? null;
  const name = clerkUser.fullName ?? handle ?? 'XPOT user';

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    create: {
      clerkId: userId,
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

  return NextResponse.json({ ok: true, user });
}
