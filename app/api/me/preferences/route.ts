// app/api/me/preferences/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const row = await prisma.userPreference.upsert({
      where: { clerkId },
      create: { clerkId, soundEnabled: true },
      update: {},
      select: { soundEnabled: true },
    });

    return NextResponse.json({ ok: true, preferences: row }, { status: 200 });
  } catch (err: any) {
    console.error('[XPOT] /api/me/preferences GET error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { soundEnabled?: unknown } | null;
    const soundEnabled = body?.soundEnabled;

    if (typeof soundEnabled !== 'boolean') {
      return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
    }

    const row = await prisma.userPreference.upsert({
      where: { clerkId },
      create: { clerkId, soundEnabled },
      update: { soundEnabled },
      select: { soundEnabled: true },
    });

    return NextResponse.json({ ok: true, preferences: row }, { status: 200 });
  } catch (err: any) {
    console.error('[XPOT] /api/me/preferences POST error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
