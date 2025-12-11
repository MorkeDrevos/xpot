// app/api/me/sync-x/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const clerkId: string | undefined = body.clerkId || body.userId || undefined;
    const xUserId: string | undefined = body.xUserId || body.x_id || body.xUser || undefined;
    const handle: string | undefined = body.handle || body.username || body.xHandle || undefined;
    const name: string | undefined = body.name || body.displayName || body.xName || undefined;
    const avatar: string | undefined = body.avatar || body.profile_image_url || body.xAvatarUrl || undefined;

    if (!clerkId && !xUserId && !handle) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_KEYS' },
        { status: 400 },
      );
    }

    // Find existing user by any of the unique identifiers
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          clerkId ? { clerkId } : undefined,
          xUserId ? { xUserId } : undefined,
          handle ? { xHandle: handle } : undefined,
        ].filter(Boolean) as any,
      },
    });

    let user;

    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          clerkId: clerkId ?? existing.clerkId,
          xUserId: xUserId ?? existing.xUserId,
          xHandle: handle ?? existing.xHandle,
          xName: name ?? existing.xName,
          xAvatarUrl: avatar ?? existing.xAvatarUrl,
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

    return NextResponse.json(
      {
        ok: true,
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
    console.error('[XPOT] /me/sync-x error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
