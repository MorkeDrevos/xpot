// app/api/public/live-entrants/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type LiveEntrant = {
  handle: string;
  avatarUrl?: string;
  followers?: number;
  verified?: boolean;
  subtitle?: string;
};

// For now: curated real X accounts (public) you can filter later.
// Avatars use unavatar (no X API needed). You can swap this to DB later.
const ALLOWLIST: LiveEntrant[] = [
  { handle: 'jup_ag', verified: true, subtitle: 'Sponsor' },
  { handle: 'solana', verified: true, subtitle: 'Ecosystem' },
  { handle: 'phantom', verified: true, subtitle: 'Wallet' },
  { handle: 'raydiumprotocol', verified: true, subtitle: 'DEX' },
  { handle: 'MeteoraAG', verified: true, subtitle: 'Liquidity' },
  { handle: 'DriftProtocol', verified: true, subtitle: 'Perps' },
  { handle: 'orca_so', verified: true, subtitle: 'DEX' },
  { handle: 'CoinGecko', verified: true, subtitle: 'Data' },
  { handle: 'DexScreener', verified: true, subtitle: 'Charts' },
  { handle: 'heliuslabs', verified: true, subtitle: 'Infra' },
  { handle: 'Backpack', verified: true, subtitle: 'Wallet' },
  { handle: 'birdeye_so', verified: true, subtitle: 'Analytics' },
];

function cleanHandle(h: string) {
  return (h || '').replace(/^@/, '').trim();
}

function avatarFromHandle(handle: string) {
  // unavatar supports x/twitter usernames
  const h = cleanHandle(handle);
  return `https://unavatar.io/x/${encodeURIComponent(h)}`;
}

function uniqByHandle(list: LiveEntrant[]) {
  const seen = new Set<string>();
  const out: LiveEntrant[] = [];

  for (const e of list) {
    const h = cleanHandle(e.handle);
    if (!h) continue;
    const key = h.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...e, handle: h, avatarUrl: e.avatarUrl || avatarFromHandle(h) });
  }

  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitRaw = Number(url.searchParams.get('limit') || '18');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 18;

  // Optional filtering: ?q=sol (matches handle or subtitle)
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();

  let list = uniqByHandle(ALLOWLIST);

  if (q) {
    list = list.filter(e => {
      const hay = `${e.handle} ${e.subtitle || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  // Simple rotate for “live” feel (no randomness needed server side)
  const now = Date.now();
  const offset = Math.floor(now / 15_000) % Math.max(1, list.length);
  const rotated = list.slice(offset).concat(list.slice(0, offset));

  const entrants = rotated.slice(0, limit);

  return NextResponse.json(
    { entrants },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
