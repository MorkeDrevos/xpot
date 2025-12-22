// app/api/public/live-entrants/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Entrant = {
  handle: string; // "elonmusk" (no @)
  name?: string;
  avatarUrl?: string;
  url?: string;
  seenAt?: string; // ISO
  note?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function shuffle<T>(arr: T[]) {
  // Fisher-Yates
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cleanAvatar(url?: string) {
  if (!url) return url;
  // X user avatars often end with "_normal". Removing it gives a bigger image.
  return url.replace('_normal', '');
}

/**
 * TEMP DESIGN MODE:
 * We fetch "real" accounts by searching recent tweets, then we pick authors as "live entrants".
 * Later we replace this with "handles that entered today’s draw".
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const limit = clamp(Number(u.searchParams.get('limit') ?? 18), 1, 30);

  // ✅ Put your Bearer token in env:
  // X_BEARER_TOKEN="..."
  const bearer =
    process.env.X_BEARER_TOKEN ||
    process.env.TWITTER_BEARER_TOKEN ||
    process.env.X_API_BEARER_TOKEN;

  if (!bearer) {
    return NextResponse.json(
      {
        entrants: [],
        note: 'Missing X_BEARER_TOKEN (server env).',
      },
      { status: 200 },
    );
  }

  // ---- FILTERS (THIS IS WHERE YOU "FILTER FOR X ACCOUNTS") ----
  // If ALLOWLIST has values -> ONLY these usernames will show.
  // Otherwise, everything matches except DENYLIST.
  const ALLOWLIST = [
    // Put handles here without @, lowercase recommended
    // 'solana',
    // 'jupiterexchange',
  ].map(s => s.toLowerCase().trim()).filter(Boolean);

  const DENYLIST = [
    // Put handles here without @
    // 'somehandle',
  ].map(s => s.toLowerCase().trim()).filter(Boolean);

  // optional “quality” filter while designing
  const MIN_FOLLOWERS = 0; // e.g. 500

  // Search query determines the pool of real users we sample from.
  // Keep it “brand-relevant” for XPOT testing.
  const query =
    u.searchParams.get('q')?.trim() ||
    '(solana OR web3 OR crypto OR airdrop OR defi) -is:retweet lang:en';

  // X API endpoint - depending on your app setup, one of these will work.
  const endpoints = [
    'https://api.x.com/2/tweets/search/recent',
    'https://api.twitter.com/2/tweets/search/recent',
  ];

  let data: any = null;
  let lastErr: any = null;

  for (const base of endpoints) {
    try {
      const apiUrl =
        `${base}?` +
        new URLSearchParams({
          query,
          max_results: String(clamp(limit * 3, 10, 100)), // fetch more, then filter + randomize
          expansions: 'author_id',
          'user.fields': 'name,username,profile_image_url,verified,public_metrics',
        }).toString();

      const r = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${bearer}` },
        cache: 'no-store',
      });

      if (!r.ok) {
        const t = await r.text().catch(() => '');
        throw new Error(`X API ${r.status}: ${t.slice(0, 300)}`);
      }

      data = await r.json();
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
    }
  }

  if (!data) {
    return NextResponse.json(
      {
        entrants: [],
        note: `X API failed: ${String(lastErr ?? 'unknown error')}`,
      },
      { status: 200 },
    );
  }

  const users = (data?.includes?.users ?? []) as any[];

  // Convert users -> entrants
  let entrants: Entrant[] = users
    .map(u => {
      const username = String(u?.username ?? '').trim();
      if (!username) return null;

      const handle = username.toLowerCase();
      const followers = Number(u?.public_metrics?.followers_count ?? 0);

      // allow/deny filters
      if (ALLOWLIST.length > 0 && !ALLOWLIST.includes(handle)) return null;
      if (DENYLIST.includes(handle)) return null;
      if (followers < MIN_FOLLOWERS) return null;

      return {
        handle: username, // keep original casing if you want; your UI likely prints @handle
        name: typeof u?.name === 'string' ? u.name : undefined,
        avatarUrl: cleanAvatar(u?.profile_image_url),
        url: `https://x.com/${username}`,
        seenAt: new Date().toISOString(),
        note: 'temp-x-sample',
      } satisfies Entrant;
    })
    .filter(Boolean) as Entrant[];

  // Randomize + trim
  entrants = shuffle(entrants).slice(0, limit);

  return NextResponse.json({
    entrants,
    source: 'x-api-recent-search',
    query,
    limit,
  });
}
