import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(50, Math.floor(n)));
}

type UserLike = {
  xHandle?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  xVerified?: boolean | null;
};

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
        const u = (t as any)?.wallet?.user as UserLike | undefined;

        const raw = u?.xHandle ? String(u.xHandle).replace(/^@/, '').trim() : '';
        if (!raw) return null;

        const handle = `@${raw}`;

        return {
          id: (t as any)?.id,
          createdAt: (t as any)?.createdAt?.toISOString?.() ?? null,
          handle,
          name: u?.name ?? null,
          avatarUrl: u?.avatarUrl ?? null,
          verified: Boolean(u?.xVerified ?? false),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, entries }, { status: 200 });
  } catch (err) {
    console.error('GET /api/entries/today error', err);
    return NextResponse.json({ ok: true, entries: [] }, { status: 200 });
  }
}
