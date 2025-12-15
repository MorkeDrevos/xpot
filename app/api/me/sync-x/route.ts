// app/api/me/sync-x/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function pickXAccount(externalAccounts: any[]) {
  return (
    externalAccounts.find((acc: any) => {
      const provider = String(acc?.provider ?? '').toLowerCase();
      return (
        provider === 'oauth_x' ||
        provider === 'oauth_twitter' ||
        provider === 'twitter' ||
        provider === 'x' ||
        provider.includes('twitter') ||
        provider.includes('oauth_x')
      );
    }) ?? null
  );
}

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const clerkUser = await clerkClient.users.getUser(clerkId);
    const externalAccounts = (clerkUser.externalAccounts ?? []) as any[];
    const xAcc = pickXAccount(externalAccounts);

    const xHandle =
      (xAcc?.username as string | undefined) ||
      (xAcc?.screenName as string | undefined) ||
      (clerkUser.username as string | undefined) ||
      null;

    const xUserId =
      (xAcc?.providerUserId as string | undefined) ||
      (xAcc?.userId as string | undefined) ||
      null;

    const xName =
      (clerkUser.fullName as string | null) ||
      ((clerkUser.firstName || clerkUser.lastName)
        ? `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim()
        : null);

    const xAvatarUrl = (clerkUser.imageUrl as string | null) ?? null;

    // 1) If a user row already exists with this clerkId, update it.
    const byClerk = await prisma.user.findUnique({ where: { clerkId } });
    if (byClerk) {
      const updated = await prisma.user.update({
        where: { id: byClerk.id },
        data: { xUserId, xHandle, xName, xAvatarUrl },
      });

      return NextResponse.json({ ok: true, linked: !!xAcc, user: updated }, { status: 200 });
    }

    // 2) Otherwise, try to MERGE into an existing row by xUserId/xHandle if present.
    let existingByX: { id: string } | null = null;

    if (xUserId) {
      existingByX = await prisma.user.findUnique({
        where: { xUserId },
        select: { id: true },
      });
    }
    if (!existingByX && xHandle) {
      existingByX = await prisma.user.findUnique({
        where: { xHandle },
        select: { id: true },
      });
    }

    if (existingByX) {
      const merged = await prisma.user.update({
        where: { id: existingByX.id },
        data: {
          clerkId, // attach Clerk identity to this existing X row
          xUserId,
          xHandle,
          xName,
          xAvatarUrl,
        },
      });

      return NextResponse.json({ ok: true, linked: !!xAcc, user: merged }, { status: 200 });
    }

    // 3) Otherwise create a new row for this authenticated Clerk user.
    const created = await prisma.user.create({
      data: {
        clerkId,
        xUserId,
        xHandle,
        xName,
        xAvatarUrl,
      },
    });

    return NextResponse.json({ ok: true, linked: !!xAcc, user: created }, { status: 200 });
  } catch (err: any) {
    console.error('[XPOT] /api/me/sync-x error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
