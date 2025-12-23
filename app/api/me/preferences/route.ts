import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ ok: false, error: 'UNAUTHED' }, { status: 401 });

  const pref = await prisma.userPreference.findUnique({
    where: { clerkUserId: userId },
  });

  return NextResponse.json({
    ok: true,
    preferences: {
      soundEnabled: pref?.soundEnabled ?? true,
    },
  });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ ok: false, error: 'UNAUTHED' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { soundEnabled?: boolean } | null;
  const soundEnabled = body?.soundEnabled;

  if (typeof soundEnabled !== 'boolean') {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const pref = await prisma.userPreference.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId, soundEnabled },
    update: { soundEnabled },
  });

  return NextResponse.json({
    ok: true,
    preferences: { soundEnabled: pref.soundEnabled },
  });
}
