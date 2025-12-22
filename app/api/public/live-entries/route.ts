// app/api/public/live-entrants/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Curated seed list for the homepage "Live lobby" while wiring real entrants.
// Later you will replace this with today's draw entrants from DB.
const SEED_HANDLES: Array<{
  handle: string;
  verified?: boolean;
  followers?: number;
  subtitle?: string;
}> = [
  { handle: 'solana', verified: true, subtitle: 'Protocol' },
  { handle: 'JupiterExchange', verified: true, subtitle: 'Liquidity' },
  { handle: 'phantom', verified: true, subtitle: 'Wallet' },
  { handle: 'RaydiumProtocol', verified: true, subtitle: 'DEX' },
  { handle: 'tensor_hq', verified: true, subtitle: 'NFT' },
  { handle: 'birdeye_so', verified: true, subtitle: 'Analytics' },
  { handle: 'coingecko', verified: true, subtitle: 'Data' },
  { handle: 'coinmarketcap', verified: true, subtitle: 'Market' },
  { handle: 'heliuslabs', verified: true, subtitle: 'Infra' },
  { handle: 'solflare_wallet', verified: true, subtitle: 'Wallet' },
  { handle: 'Backpack', verified: true, subtitle: 'Wallet' },
  { handle: 'meteoraAG', verified: true, subtitle: 'Liquidity' },
];

// Use Unavatar so you get a stable image without X API.
// If unavatar is ever rate-limited, LiveEntrantsLounge will safely hide rows without avatarUrl.
function avatarUrl(handle: string) {
  const h = (handle || '').replace(/^@/, '').trim();
  return `https://unavatar.io/x/${encodeURIComponent(h)}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitRaw = url.searchParams.get('limit') || '18';
  const limit = Math.max(1, Math.min(60, Number(limitRaw) || 18));

  // Rotate slightly so it feels "alive" even before real data:
  const minuteBucket = Math.floor(Date.now() / 60_000);
  const rotated = [...SEED_HANDLES].sort((a, b) => {
    const ka = (a.handle.charCodeAt(0) + minuteBucket) % 1000;
    const kb = (b.handle.charCodeAt(0) + minuteBucket) % 1000;
    return ka - kb;
  });

  const entrants = rotated.slice(0, limit).map(e => ({
    handle: e.handle,
    avatarUrl: avatarUrl(e.handle),
    verified: Boolean(e.verified),
    followers: e.followers,
    subtitle: e.subtitle,
  }));

  return NextResponse.json(
    { entrants, source: 'seed', updatedAt: new Date().toISOString() },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
