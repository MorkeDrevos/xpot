// app/api/public/live-entrants/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Entrant = {
  handle: string; // without @
  avatarUrl: string | null;
  verified: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cleanAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // X profile images often include "_normal" (lower-res). Remove it for nicer UI.
  // Example: .../abc_normal.jpg -> .../abc.jpg
  return url.replace('_normal', '');
}

function pickToken() {
  return (
    process.env.XPOT_X_BEARER_TOKEN ||
    process.env.X_BEARER_TOKEN ||
    process.env.TWITTER_BEARER_TOKEN ||
    process.env.X_API_BEARER_TOKEN ||
    ''
  );
}

// This is the "filter for X accounts" - it defines which real users you pull.
// You can tweak the keywords to shape the vibe (crypto/solana/web3 etc).
function buildQuery() {
  // Keep it broad but relevant, avoid replies/retweets so we get more unique authors.
  return [
    '(solana OR web3 OR crypto OR defi OR airdrop OR memecoin OR pumpfun OR raydium OR jupiter)',
    '-is:retweet',
    '-is:reply',
    'lang:en',
  ].join(' ');
}

async function fetchRecentUsers(limitUsers: number, bearer: string): Promise<Entrant[]> {
  const query = buildQuery();

  // Pull more tweets than you need so you have a bigger author pool.
  const maxResults = clamp(limitUsers * 3, 10, 100);

  const url = new URL('https://api.twitter.com/2/tweets/search/recent');
  url.searchParams.set('query', query);
  url.searchParams.set('max_results', String(maxResults));
  url.searchParams.set('expansions', 'author_id');
  url.searchParams.set('tweet.fields', 'author_id');
  url.searchParams.set('user.fields', 'username,profile_image_url,verified');

  const r = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${bearer}`,
    },
    // Avoid Next caching the upstream call in a weird way.
    cache: 'no-store',
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`X API error ${r.status}: ${text.slice(0, 200)}`);
  }

  const data = (await r.json().catch(() => null)) as any;

  const users = (data?.includes?.users ?? []) as Array<{
    username?: string;
    profile_image_url?: string;
    verified?: boolean;
  }>;

  // Deduplicate by username
  const uniq = new Map<string, Entrant>();
  for (const u of users) {
    const handle = (u?.username ?? '').trim();
    if (!handle) continue;

    if (!uniq.has(handle)) {
      uniq.set(handle, {
        handle,
        avatarUrl: cleanAvatarUrl(u?.profile_image_url ?? null),
        verified: Boolean(u?.verified),
      });
    }
  }

  // Randomize and take N
  return shuffle([...uniq.values()]).slice(0, limitUsers);
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const limit = clamp(Number(u.searchParams.get('limit') || 18), 1, 30);

    const bearer = pickToken();
    if (!bearer) {
      return NextResponse.json(
        { entrants: [], error: 'Missing XPOT_X_BEARER_TOKEN' },
        { status: 200 },
      );
    }

    const entrants = await fetchRecentUsers(limit, bearer);

    // Cache at the edge briefly so you don’t burn rate limits when you refresh a lot.
    // Still “live enough” for design/testing.
    return new NextResponse(JSON.stringify({ entrants, source: 'x-recent-search' }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, s-maxage=20, stale-while-revalidate=120',
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { entrants: [], error: e?.message || 'Failed to load live entrants' },
      { status: 200 },
    );
  }
}
