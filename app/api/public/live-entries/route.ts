// app/api/public/live-entries/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIN_FOLLOWERS = 100;

function normalizeHandle(h: string) {
  return (h || '').replace(/^@/, '').trim();
}

type XUser = {
  username: string;
  public_metrics?: { followers_count?: number };
  profile_image_url?: string;
};

async function fetchXUsers(usernames: string[]) {
  const token = process.env.XPOT_X_BEARER_TOKEN;
  if (!token) return new Map<string, { followers: number; avatar?: string }>();

  const clean = Array.from(
    new Set(usernames.map(normalizeHandle).filter(Boolean).slice(0, 100)),
  );

  if (!clean.length) return new Map();

  const url = new URL('https://api.x.com/2/users/by');
  url.searchParams.set('usernames', clean.join(','));
  url.searchParams.set('user.fields', 'public_metrics,profile_image_url');

  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!r.ok) return new Map();

  const json = await r.json();
  const data: XUser[] = Array.isArray(json?.data) ? json.data : [];

  const out = new Map<string, { followers: number; avatar?: string }>();
  for (const u of data) {
    const username = typeof u?.username === 'string' ? u.username : '';
    const followers = typeof u?.public_metrics?.followers_count === 'number'
      ? u.public_metrics.followers_count
      : 0;
    const avatar = typeof u?.profile_image_url === 'string' ? u.profile_image_url : undefined;

    if (username) out.set(username.toLowerCase(), { followers, avatar });
  }

  return out;
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
  const map = await fetchXUsers(handles);

  const entries = rawEntries
    .map(e => {
      const handle = normalizeHandle(e.handle);
      const meta = map.get(handle.toLowerCase());
      return {
        handle,
        followers: meta?.followers ?? 0,
        avatarUrl: meta?.avatar,
      };
    })
    .filter(e => e.followers >= MIN_FOLLOWERS); // also implies “exists on X” because otherwise followers = 0

  return NextResponse.json(
    {
      updatedAt: new Date().toISOString(),
      minFollowers: MIN_FOLLOWERS,
      entries,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
