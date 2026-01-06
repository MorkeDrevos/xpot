// app/api/entries/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(50, Math.floor(n)));
}

export async function GET(req: NextRequest) {
  try {
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 24);

    // latest tickets (your "today" UI is actually "latest entrants", not calendar-day filtered)
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        wallet: { include: { user: true } },
      },
    });

    const entries = tickets
      .map(t => {
        const u = t.wallet?.user as any;
        const raw = u?.xHandle ?? u?.handle ?? u?.username ?? null;
        const handle = raw ? `@${String(raw).replace(/^@/, '')}` : null;
        if (!handle) return null;

        return {
          id: t.id,
          createdAt: t.createdAt.toISOString(),
          handle,
          name: u?.name ?? null,
          avatarUrl: u?.avatarUrl ?? null,
          verified: Boolean(u?.xVerified ?? u?.verified ?? false),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, entries }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/entries/today error', err);
    return NextResponse.json({ ok: false, entries: [] }, { status: 200 });
  }
}
