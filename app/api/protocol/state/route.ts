import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type DexPair = {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  url?: string;
  priceUsd?: string;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
};

function toNum(x: unknown) {
  const n = typeof x === 'number' ? x : Number(x);
  return Number.isFinite(n) ? n : undefined;
}

function pickBestSolanaPair(pairs: DexPair[]) {
  const sol = (pairs || []).filter(p => (p?.chainId || '').toLowerCase() === 'solana');
  if (sol.length === 0) return null;

  // Prefer highest liquidity USD
  sol.sort((a, b) => (toNum(b?.liquidity?.usd) ?? 0) - (toNum(a?.liquidity?.usd) ?? 0));
  return sol[0] ?? null;
}

function liquiditySignalFromLp(lpUsd?: number) {
  if (!Number.isFinite(Number(lpUsd))) return undefined;

  const lp = Number(lpUsd);
  if (lp >= 50_000) return 'HEALTHY';
  if (lp >= 10_000) return 'WATCH';
  return 'CRITICAL';
}

export async function GET() {
  const mint =
    process.env.NEXT_PUBLIC_XPOT_MINT ||
    process.env.NEXT_PUBLIC_XPOT_CA ||
    process.env.XPOT_MINT ||
    '';

  // If mint not set, return empty (non-fatal)
  if (!mint) {
    return NextResponse.json(
      {
        state: {
          updatedAt: new Date().toISOString(),
          source: 'dexscreener',
        },
      },
      { status: 200 },
    );
  }

  try {
    // DexScreener token endpoint
    const url = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      // treat as unavailable, not fatal
      return NextResponse.json(
        {
          state: {
            updatedAt: new Date().toISOString(),
            source: 'dexscreener',
          },
        },
        { status: 200 },
      );
    }

    const j = (await res.json().catch(() => ({}))) as { pairs?: DexPair[] };
    const best = pickBestSolanaPair(Array.isArray(j?.pairs) ? j.pairs : []);

    if (!best) {
      // No indexed pair yet
      return NextResponse.json(
        {
          state: {
            updatedAt: new Date().toISOString(),
            source: 'dexscreener',
          },
        },
        { status: 200 },
      );
    }

    const lpUsd = toNum(best?.liquidity?.usd);
    const priceUsd = toNum(best?.priceUsd);
    const volume24hUsd = toNum(best?.volume?.h24);

    return NextResponse.json(
      {
        state: {
          lpUsd,
          priceUsd,
          volume24hUsd,
          // lpChange24hPct: (optional - add later once you store snapshots)
          liquiditySignal: liquiditySignalFromLp(lpUsd),
          updatedAt: new Date().toISOString(),
          source: 'dexscreener',
          pairUrl: best?.url,
          pairAddress: best?.pairAddress,
          chainId: best?.chainId,
          dexId: best?.dexId,
        },
      },
      { status: 200 },
    );
  } catch {
    // Non-fatal
    return NextResponse.json(
      {
        state: {
          updatedAt: new Date().toISOString(),
          source: 'dexscreener',
        },
      },
      { status: 200 },
    );
  }
}
