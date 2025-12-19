// app/api/public/live-entries/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIN_FOLLOWERS = 100;

function normalizeHandle(h: string) {
  return (h || '').replace(/^@/, '').trim();
}

function upgradeAvatar(url: string) {
  // X commonly returns ..._normal.* (or sometimes _bigger.*). Upgrade if possible.
  return url.replace('_normal', '_400x400').replace('_bigger', '_400x400');
}

function isDefaultAvatar(url?: string) {
  if (!url) return true;
  const u = url.toLowerCase();

  // X/Twitter default avatars commonly live under these paths/names
  if (u.includes('default_profile_images/')) return true;
  if (u.includes('default_profile_normal')) return true;
  if (u.includes('default_profile_')) return true;

  return false;
}

type XUser = {
  username?: string;
  public_metrics?: { followers_count?: number };
  profile_image_url?: string;
};

type XError = {
  value?: string; // username we requested
  title?: string;
  detail?: string;
  type?: string;
};

async function fetchXUsers(usernames: string[]) {
  // Support either env var name (to avoid silent empties)
  const token =
    process.env.XPOT_X_BEARER_TOKEN ||
    process.env.XPOT_X_BEARER ||
    process.env.X_BEARER_TOKEN;

  const empty = {
    meta: new Map<string, { followers: number; avatar?: string }>(),
    blocked: new Set<string>(),
    status: 0,
  };

  if (!token) return empty;

  const clean = Array.from(new Set(usernames.map(normalizeHandle).filter(Boolean))).slice(0, 100);
  if (!clean.length) return empty;

  const url = new URL('https://api.x.com/2/users/by');
  url.searchParams.set('usernames', clean.join(','));
  url.searchParams.set('user.fields', 'public_metrics,profile_image_url');

  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  // If X rejects/limits us, return empty but keep status so we can introspect.
  if (!r.ok) return { ...empty, status: r.status };

  const json = await r.json();

  // Anything in `errors` is not acceptable (suspended, not found, etc.)
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

  return { meta, blocked, status: r.status };
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
  const { meta, blocked, status } = await fetchXUsers(handles);

  // Counters to quickly tell WHY you got 0 results (safe to expose)
  const reasons = {
    blocked: 0,
    underMinFollowers: 0,
    missingAvatar: 0,
    defaultAvatar: 0,
    ok: 0,
  };

  const cleaned = rawEntries
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
    .filter(e => {
      if (e._blocked) {
        reasons.blocked += 1;
        return false;
      }
      if (e.followers < MIN_FOLLOWERS) {
        reasons.underMinFollowers += 1;
        return false;
      }
      if (!e.avatarUrl) {
        reasons.missingAvatar += 1;
        return false;
      }
      if (isDefaultAvatar(e.avatarUrl)) {
        reasons.defaultAvatar += 1;
        return false;
      }

      reasons.ok += 1;
      return true;
    })
    .map(({ _blocked, ...rest }) => rest);

  return NextResponse.json(
    {
      updatedAt: new Date().toISOString(),
      minFollowers: MIN_FOLLOWERS,
      entries: cleaned,

      // Safe debug info (no token). Helps explain "why empty".
      xStatus: status, // 0 = token missing, 401/403/429 etc possible
      reasons,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
