import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

function cleanAvatar(url?: string) {
  if (!url) return undefined;
  // remove "_normal" for higher-res avatars
  return url.replace('_normal', '');
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = clamp(Number(url.searchParams.get('limit') || 18), 1, 30);

  const bearer =
    process.env.X_BEARER_TOKEN ||
    process.env.TWITTER_BEARER_TOKEN;

  if (!bearer) {
    return NextResponse.json(
      { entrants: [], error: 'Missing X_BEARER_TOKEN' },
      { status: 200 },
    );
  }

  /**
   * This query defines the "random pool".
   * You can tweak keywords to shape the vibe,
   * but users are always real.
   */
  const query = '(solana OR crypto) -is:retweet lang:en is:verified';

  const apiUrl =
    `https://api.x.com/2/tweets/search/recent?` +
    new URLSearchParams({
      query,
      max_results: '100',
      expansions: 'author_id',
      'user.fields': 'name,username,profile_image_url,verified,public_metrics',
    }).toString();

  try {
    const r = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${bearer}` },
      cache: 'no-store',
    });

    if (!r.ok) {
      const t = await r.text().catch(() => '');
      return NextResponse.json(
        { entrants: [], error: `X API ${r.status}`, detail: t.slice(0, 200) },
        { status: 200 },
      );
    }

    const json = await r.json();
    const users = (json?.includes?.users || []) as any[];

    // Map → shuffle → trim
    const entrants = shuffle(
      users
        .filter(u => u?.username && u?.profile_image_url)
        .map(u => ({
          handle: u.username,
          avatarUrl: cleanAvatar(u.profile_image_url),
          verified: Boolean(u.verified),
          followers: u.public_metrics?.followers_count ?? undefined,
        })),
    ).slice(0, limit);

    return NextResponse.json({
      entrants,
      source: 'x-recent-search',
    });
  } catch (err: any) {
    return NextResponse.json(
      { entrants: [], error: err?.message || 'Fetch failed' },
      { status: 200 },
    );
  }
}
