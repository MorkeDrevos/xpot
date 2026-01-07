import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number, min = 1, max = 200) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function normalizeHandle(h: any) {
  const s = String(h ?? '').trim();
  if (!s) return null;
  const clean = s.replace(/^@+/, '').trim();
  if (!clean) return null;
  return `@${clean}`;
}

type Entry = {
  id: string;
  createdAt: string;
  handle: string;
  xHandle: string;
  xName: string | null;
  xAvatarUrl: string | null;
  name: string | null;
  avatarUrl: string | null;
  verified: boolean;
};

// latest unique by handle (keep newest)
function dedupeByHandleKeepLatest(entries: Entry[]) {
  const map = new Map<string, Entry>();

  for (const e of entries) {
    const key = e.handle.toLowerCase();
    const cur = map.get(key);

    const et = Date.parse(e.createdAt);
    const ct = cur ? Date.parse(cur.createdAt) : -1;

    if (!cur || (Number.isFinite(et) && et >= ct)) {
      map.set(key, e);
    }
  }

  const out = Array.from(map.values());
  out.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 24, 1, 200);

    // mode:
    // - raw (default): return latest ticket events (duplicates allowed)
    // - unique: return latest unique handles (deduped)
    const mode = String(req.nextUrl.searchParams.get('mode') ?? 'raw').toLowerCase();
    const wantUnique = mode === 'unique';

    // if unique, pull more rows so dedupe still yields enough distinct handles
    const take = wantUnique ? Math.min(600, Math.max(limit * 12, 120)) : limit;

    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        wallet: { include: { user: true } },
      },
    });

    const mapped: Entry[] = tickets
      .map(t => {
        const u: any = t.wallet?.user;
        const handle = normalizeHandle(u?.xHandle);
        if (!handle) return null;

        const xName = u?.xName ?? u?.name ?? null;
        const xAvatarUrl = u?.xAvatarUrl ?? u?.avatarUrl ?? null;
        const xVerified = u?.xVerified ?? u?.verified ?? null;

        return {
          id: t.id,
          createdAt: t.createdAt.toISOString(),

          // backward compat
          handle,

          // explicit x fields
          xHandle: handle.replace(/^@/, ''),
          xName: xName ? String(xName).trim() : null,
          xAvatarUrl: xAvatarUrl ? String(xAvatarUrl).trim() : null,

          // legacy aliases (some clients still read these)
          name: xName ? String(xName).trim() : null,
          avatarUrl: xAvatarUrl ? String(xAvatarUrl).trim() : null,

          verified: xVerified === true,
        } as Entry;
      })
      .filter(Boolean) as Entry[];

    const entries = wantUnique ? dedupeByHandleKeepLatest(mapped).slice(0, limit) : mapped.slice(0, limit);

    return NextResponse.json(
      {
        ok: true,
        mode: wantUnique ? 'unique' : 'raw',
        count: entries.length,
        entries,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('GET /api/public/entries/latest error', err);
    return NextResponse.json({ ok: true, entries: [] }, { status: 200 });
  }
}
