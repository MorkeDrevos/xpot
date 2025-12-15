// app/api/me/sync-x/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function pickXAccount(externalAccounts: any[]) {
  // Clerk providers can vary; we match common X/Twitter identifiers
  return (
    externalAccounts.find((acc: any) => {
      const provider = String(acc?.provider ?? '').toLowerCase();
      return (
        provider === 'oauth_x' ||
        provider === 'oauth_twitter' ||
        provider === 'twitter' ||
        provider.includes('twitter') ||
        provider === 'x' ||
        provider.includes('oauth_x')
      );
    }) ?? null
  );
}

export async function POST() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    // Fetch full Clerk user (server-side)
    const user = await clerkClient.users.getUser(userId);

    const externalAccounts = (user.externalAccounts ?? []) as any[];
    const xAcc = pickXAccount(externalAccounts);

    // If user is signed in but has no X connected, we still upsert Clerk user row
    const clerkId = user.id;

    const handle =
      (xAcc?.username as string | undefined) ||
      (xAcc?.screenName as string | undefined) ||
      (user.username as string | undefined) ||
      null;

    const xUserId =
      (xAcc?.providerUserId as string | undefined) ||
      (xAcc?.userId as string | undefined) ||
      null;

    const name =
      (user.fullName as string | null) ||
      (user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : null) ||
      null;

    const avatar = (user.imageUrl as string | null) ?? null;

    // Upsert by clerkId (this is your strongest identifier)
    const dbUser = await prisma.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        xUserId,
        xHandle: handle,
        xName: name,
        xAvatarUrl: avatar,
      },
      update: {
        xUserId,
        xHandle: handle,
        xName: name,
        xAvatarUrl: avatar,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        linked: !!xAcc,
        user: {
          id: dbUser.id,
          clerkId: dbUser.clerkId,
          xUserId: dbUser.xUserId,
          xHandle: dbUser.xHandle,
          xName: dbUser.xName,
          xAvatarUrl: dbUser.xAvatarUrl,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /api/me/sync-x error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
