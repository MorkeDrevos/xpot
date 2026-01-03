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

    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        wallet: { include: { user: true } },
      },
    });

    const entries = tickets
      .map(t => {
        const u = t.wallet?.user;
        const handle = u?.xHandle ? `@${String(u.xHandle).replace(/^@/, '')}` : null;
        if (!handle) return null;

        return {
          id: t.id,
          createdAt: t.createdAt.toISOString(),
          handle,
          name: (u as any)?.name ?? null,
          avatarUrl: (u as any)?.avatarUrl ?? null,
          verified: Boolean((u as any)?.xVerified ?? false),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, entries }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/public/entries/latest error', err);
    return NextResponse.json({ ok: true, entries: [] }, { status: 200 });
  }
}
