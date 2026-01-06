// app/api/entries/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(80, Math.floor(n)));
}

function normalizeHandle(raw: any): string | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const clean = s.replace(/^@/, '');
  if (!clean) return null;
  return `@${clean}`;
}

function pickUserHandle(u: any): string | null {
  // be tolerant - your schema/name has changed before
  return (
    normalizeHandle(u?.xHandle) ||
    normalizeHandle(u?.handle) ||
    normalizeHandle(u?.xUsername) ||
    normalizeHandle(u?.username) ||
    normalizeHandle(u?.twitterHandle) ||
    null
  );
}

export async function GET(req: NextRequest) {
  try {
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 24);

    // "today" in Madrid-ish: use server local day window (good enough for stage)
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const tickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: start } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        wallet: { include: { user: true } },
        // if your Ticket also has direct user relation, this keeps it future-proof
        // @ts-expect-error - only if exists in your schema
        user: true,
      } as any,
    });

    const entries = tickets
      .map(t => {
        const u = (t as any)?.user ?? t.wallet?.user;
        const handle = pickUserHandle(u);
        if (!handle) return null;

        return {
          id: t.id,
          createdAt: t.createdAt?.toISOString?.() ?? new Date(t.createdAt as any).toISOString(),
          handle,
          name: (u as any)?.name ?? null,
          avatarUrl: (u as any)?.avatarUrl ?? null,
          verified: Boolean((u as any)?.xVerified ?? (u as any)?.verified ?? false),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, entries }, { status: 200 });
  } catch (err) {
    console.error('GET /api/entries/today error', err);
    return NextResponse.json({ ok: true, entries: [] }, { status: 200 });
  }
}
