// app/api/public/entries/latest/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function withAt(handle?: string | null) {
  if (!handle) return null;
  const h = handle.trim();
  if (!h) return null;
  return h.startsWith('@') ? h : `@${h}`;
}

export async function GET() {
  try {
    // Adjust model name if yours is Entry/Ticket/etc.
    // This assumes “Ticket claimed/created” is the entry event.
    const rows = await prisma.ticket.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: 18,
      include: {
        wallet: {
          include: { user: true },
        },
      },
    });

    const entries = rows
      .map(t => {
        const user = t.wallet?.user ?? null;
        const handle = withAt((user as any)?.xHandle ?? null);
        if (!handle) return null;

        return {
          id: t.id,
          createdAt: t.createdAt.toISOString(),
          handle,
          name: (user as any)?.xName ?? null,
          avatarUrl: (user as any)?.xAvatarUrl ?? null,
          verified: Boolean((user as any)?.xVerified ?? false),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, entries }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, entries: [] }, { status: 200 });
  }
}
