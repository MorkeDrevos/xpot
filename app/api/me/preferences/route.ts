// app/api/me/preferences/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

async function requireUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;

  return user;
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const preferences = await prisma.userPreference.findUnique({
      where: { userId: user.id },
      select: { soundEnabled: true, updatedAt: true },
    });

    return NextResponse.json(
      {
        ok: true,
        preferences: preferences ?? { soundEnabled: true },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /api/me/preferences GET error:', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as any;
    const soundEnabled = body?.soundEnabled;

    if (typeof soundEnabled !== 'boolean') {
      return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
    }

    const updated = await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, soundEnabled },
      update: { soundEnabled },
      select: { soundEnabled: true, updatedAt: true },
    });

    return NextResponse.json({ ok: true, preferences: updated }, { status: 200 });
  } catch (err: any) {
    console.error('[XPOT] /api/me/preferences POST error:', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
