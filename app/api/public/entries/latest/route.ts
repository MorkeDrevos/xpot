import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(50, Math.floor(n)));
}

function normalizeHandle(h: any) {
  const s = String(h ?? '').trim();
  if (!s) return null;
  const clean = s.replace(/^@+/, '').trim();
  if (!clean) return null;
  return `@${clean}`;
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
        const u: any = t.wallet?.user;
        const handle = normalizeHandle(u?.xHandle);
        if (!handle) return null;

        // ✅ Use REAL X identity fields first (these are what your app uses elsewhere)
        const xName = u?.xName ?? u?.name ?? null;
        const xAvatarUrl = u?.xAvatarUrl ?? u?.avatarUrl ?? null;
        const xVerified = u?.xVerified ?? u?.verified ?? null;

        return {
          id: t.id,
          createdAt: t.createdAt.toISOString(),

          // keep "handle" for backward compat with your client mapping
          handle,

          // also expose x* keys so any newer client can consume it directly
          xHandle: handle.replace(/^@/, ''),
          xName: xName ? String(xName).trim() : null,
          xAvatarUrl: xAvatarUrl ? String(xAvatarUrl).trim() : null,

          name: xName ? String(xName).trim() : null,
          avatarUrl: xAvatarUrl ? String(xAvatarUrl).trim() : null,

          verified: xVerified === true,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, entries }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/public/entries/latest error', err);
    return NextResponse.json({ ok: true, entries: [] }, { status: 200 });
  }
}
