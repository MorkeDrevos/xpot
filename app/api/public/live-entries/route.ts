// app/api/public/live-entries/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIN_FOLLOWERS = 100;

function normalizeHandle(h: string) {
  return (h || '').replace(/^@/, '').trim();
}

function upgradeAvatar(url: string) {
  // X often returns ..._normal.jpg - bump quality
  return url.replace('_normal', '_400x400');
}

function isDefaultAvatar(url?: string) {
  if (!url) return true;

  const u = url.toLowerCase();

  // Common default avatar patterns on X/Twitter CDN
  if (u.includes('default_profile_images/')) return true;
  if (u.includes('default_profile_normal')) return true;
  if (u.includes('default_profile_')) return true;

  return false;
}

type XUser = {
  username: string;
  public_metrics?: { followers_count?: number };
  profile_image_url?: string;
};

type XError = {
  value?: string; // username string we requested
  title?: string;
  detail?: string;
  type?: string;
};

async function fetchXUsers(usernames: string[]) {
  const token = process.env.XPOT_X_BEARER_TOKEN;
  if (!token) {
    return {
      meta: new Map<string, { followers: number; avatar?: string }>(),
      blocked: new Set<string>(),
    };
  }

  const clean = Array.from(new Set(usernames.map(normalizeHandle).filter(Boolean))).slice(0, 100);

  if (!clean.length) {
    return {
      meta: new Map<string, { followers: number; avatar?: string }>(),
      blocked: new Set<string>(),
    };
  }

  const url = new URL('https://api.x.com/2/users/by');
  url.searchParams.set('usernames', clean.join(','));
  url.searchParams.set('user.fields', 'public_metrics,profile_image_url');

  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!r.ok) {
    return {
      meta: new Map<string, { followers: number; avatar?: string }>(),
      blocked: new Set<string>(),
    };
  }

  const json = await r.json();

  // Anything in errors is not acceptable (suspended, not found, etc.)
  const blocked = new Set<string>();
  const errors: XError[] = Array.isArray(json?.errors) ? json.errors : [];
  for (const e of errors) {
    const v = typeof e?.value === 'string' ? normalizeHandle(e.value) : '';
    if (v) blocked.add(v.toLowerCase());
  }

  const data: XUser[] = Array.isArray(json?.data) ? json.data : [];
  const meta = new Map<string, { followers: number; avatar?: string }>();

  for (const u of data) {
    const username = typeof u?.username === 'string' ? normalizeHandle(u.username) : '';
    if (!username) continue;

    const followers =
      typeof u?.public_metrics?.followers_count === 'number' ? u.public_metrics.followers_count : 0;

    const rawAvatar = typeof u?.profile_image_url === 'string' ? u.profile_image_url.trim() : '';
    const avatar = rawAvatar ? upgradeAvatar(rawAvatar) : undefined;

    meta.set(username.toLowerCase(), { followers, avatar });
  }

  return { meta, blocked };
}

export async function GET() {
  // TEMP SOURCE - replace with DB later
  const rawEntries = [
    { handle: 'CryptoNox' },
    { handle: 'XPOTMaxi' },
    { handle: 'ChartHermit' },
    { handle: 'SolanaSignals' },
    { handle: 'LoopMode' },
  ];

  const handles = rawEntries.map(e => normalizeHandle(e.handle)).filter(Boolean);
  const { meta, blocked } = await fetchXUsers(handles);

  const entries = rawEntries
    .map(e => {
      const handle = normalizeHandle(e.handle);
      const key = handle.toLowerCase();
      const m = meta.get(key);

      return {
        handle,
        followers: m?.followers ?? 0,
        avatarUrl: m?.avatar,
        _blocked: blocked.has(key),
      };
    })
    .filter(e => !e._blocked) // suspended / not found / etc.
    .filter(e => e.followers >= MIN_FOLLOWERS)
    .filter(e => !!e.avatarUrl) // must have an avatar URL
    .filter(e => !isDefaultAvatar(e.avatarUrl)); // must not be the default “same face” avatar

  // strip internal field
  const cleaned = entries.map(({ _blocked, ...rest }) => rest);

  return NextResponse.json(
    {
      updatedAt: new Date().toISOString(),
      minFollowers: MIN_FOLLOWERS,
      entries: cleaned,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
