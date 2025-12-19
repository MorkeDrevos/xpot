// app/api/public/live-entries/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const MIN_FOLLOWERS = 100;

async function fetchFollowerCounts(handles: string[]) {
  const usernames = handles
    .map(h => h.replace(/^@/, '').trim())
    .filter(Boolean)
    .slice(0, 100); // X API batch limit for usernames

  if (!usernames.length) return new Map<string, number>();

  const token = process.env.XPOT_X_BEARER_TOKEN;
  if (!token) return new Map<string, number>(); // fail closed or open - your choice

  const url =
    `https://api.x.com/2/users/by?usernames=${encodeURIComponent(usernames.join(','))}` +
    `&user.fields=public_metrics`;

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!r.ok) return new Map<string, number>();

  const json = await r.json();

  const map = new Map<string, number>();
  for (const u of json?.data ?? []) {
    const username = String(u?.username ?? '').toLowerCase();
    const followers = Number(u?.public_metrics?.followers_count ?? 0);
    if (username) map.set(username, followers);
  }
  return map;
}

export async function GET() {
  // 1) get your raw entries from DB however you already do it
  // Example: const rawHandles = await getLiveHandlesFromDb();
  const rawHandles: string[] = []; // <-- replace with your existing source

  const clean = rawHandles
    .map(h => h.replace(/^@/, '').trim())
    .filter(Boolean);

  const counts = await fetchFollowerCounts(clean);

  // 2) keep only “real” + >= 100 followers
  const entries = clean
    .map(h => {
      const followers = counts.get(h.toLowerCase()) ?? 0;
      return { handle: h, followers };
    })
    .filter(x => x.followers >= MIN_FOLLOWERS);

  return NextResponse.json({ entries });
}
