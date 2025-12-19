// app/api/public/live-entries/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIN_FOLLOWERS = 100;

function normalizeHandle(h: string) {
  return (h || '').replace(/^@/, '').trim();
}

async function fetchFollowerCounts(usernames: string[]) {
  const token = process.env.XPOT_X_BEARER_TOKEN;
  if (!token) return new Map<string, number>();

  const clean = Array.from(
    new Set(
      usernames
        .map(normalizeHandle)
        .filter(Boolean)
        .slice(0, 100), // X API usernames/by supports up to 100 per request
    ),
  );

  if (!clean.length) return new Map<string, number>();

  const url = new URL('https://api.x.com/2/users/by');
  url.searchParams.set('usernames', clean.join(','));
  url.searchParams.set('user.fields', 'public_metrics');

  const r = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!r.ok) {
    // If X is down / rate-limited, fail closed (return empty map so we filter everything out)
    return new Map<string, number>();
  }

  const json = await r.json();

  const out = new Map<string, number>();
  const data = Array.isArray(json?.data) ? json.data : [];

  for (const u of data) {
    const username = typeof u?.username === 'string' ? u.username : '';
    const followers =
      typeof u?.public_metrics?.followers_count === 'number'
        ? u.public_metrics.followers_count
        : 0;

    if (username) out.set(username.toLowerCase(), followers);
  }

  return out;
}

export async function GET() {
  // TEMP SOURCE (replace later with DB query)
  const rawEntries = [
    { handle: 'CryptoNox' },
    { handle: 'XPOTMaxi' },
    { handle: 'ChartHermit' },
    { handle: 'SolanaSignals' },
    { handle: 'LoopMode' },
  ];

  const handles = rawEntries.map(e => normalizeHandle(e.handle)).filter(Boolean);
  const followersMap = await fetchFollowerCounts(handles);

  // Filter: must exist (returned by X) AND followers >= MIN_FOLLOWERS
  const entries = rawEntries
    .map(e => ({ handle: normalizeHandle(e.handle) }))
    .filter(e => {
      const followers = followersMap.get(e.handle.toLowerCase());
      return typeof followers === 'number' && followers >= MIN_FOLLOWERS;
    });

  return NextResponse.json(
    {
      updatedAt: new Date().toISOString(),
      minFollowers: MIN_FOLLOWERS,
      entries,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
