// app/api/protocol/state/route.ts
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

function n(v: unknown): number | undefined {
  const num = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(num) ? num : undefined;
}

function normChainId(v?: string) {
  return (v || '').toLowerCase().trim();
}

function pickBestPair(pairs: DexPair[]): DexPair | null {
  if (!Array.isArray(pairs) || pairs.length === 0) return null;

  // Prefer Solana, then highest liquidity USD
  const sol = pairs.filter((p) => normChainId(p.chainId) === 'solana');
  const list = sol.length ? sol : pairs;

  const sorted = [...list].sort((a, b) => (n(b.liquidity?.usd) ?? 0) - (n(a.liquidity?.usd) ?? 0));
  return sorted[0] ?? null;
}

function liquiditySignal(lpUsd?: number) {
  if (!Number.isFinite(Number(lpUsd))) return undefined;
  if ((lpUsd ?? 0) >= 100_000) return 'HEALTHY' as const;
  if ((lpUsd ?? 0) >= 20_000) return 'WATCH' as const;
  return 'CRITICAL' as const;
}

function filterRelevantPairs(pairs: DexPair[], scope: 'solana' | 'all') {
  const base = Array.isArray(pairs) ? pairs : [];

  const scoped =
    scope === 'solana'
      ? base.filter((p) => normChainId(p.chainId) === 'solana')
      : base;

  // Keep only pairs with valid positive liquidity
  return scoped.filter((p) => {
    const lp = n(p.liquidity?.usd);
    return typeof lp === 'number' && lp > 0;
  });
}

function sumLpUsd(pairs: DexPair[]) {
  let total = 0;
  for (const p of pairs) total += n(p.liquidity?.usd) ?? 0;
  return total > 0 ? total : undefined;
}

function sumVol24hUsd(pairs: DexPair[]) {
  let total = 0;
  for (const p of pairs) total += n(p.volume?.h24) ?? 0;
  return total > 0 ? total : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const mint =
    searchParams.get('mint') ||
    process.env.NEXT_PUBLIC_XPOT_MINT ||
    process.env.NEXT_PUBLIC_XPOT_CA ||
    process.env.XPOT_MINT ||
    '';

  // Birdeye-like ALL PAIRS:
  // - default scope is Solana (this matches how you likely want XPOT)
  // - allow ?scope=all to aggregate across all chains DexScreener returns
  const scopeParam = (searchParams.get('scope') || '').toLowerCase().trim();
  const scope: 'solana' | 'all' = scopeParam === 'all' ? 'all' : 'solana';

  if (!mint) {
    return NextResponse.json(
      { error: 'Missing mint. Provide ?mint=... or set NEXT_PUBLIC_XPOT_MINT.' },
      { status: 400 },
    );
  }

  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`;

    const r = await fetch(url, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });

    if (!r.ok) {
      return NextResponse.json({
        state: {
          updatedAt: new Date().toISOString(),
          source: 'dexscreener',
        },
      });
    }

    const j = (await r.json().catch(() => ({}))) as { pairs?: DexPair[] };
    const allPairs = Array.isArray(j?.pairs) ? j.pairs : [];

    // 1) Filter to relevant pairs (Solana by default) and only pairs with positive LP
    const relevantPairs = filterRelevantPairs(allPairs, scope);

    // 2) Aggregate LP + volume across all relevant pairs (Birdeye "ALL PAIRS" style)
    const lpUsd = sumLpUsd(relevantPairs);
    const volume24hUsd = sumVol24hUsd(relevantPairs);

    // 3) Choose a single "reference pair" for price + link display
    //    Use the best among relevant pairs; fallback to best among all pairs.
    const ref = pickBestPair(relevantPairs.length ? relevantPairs : allPairs);

    const priceUsd = n(ref?.priceUsd);

    return NextResponse.json({
      state: {
        // Aggregated (ALL PAIRS style)
        lpUsd,
        volume24hUsd,

        // Still optional until you implement real 24h change
        lpChange24hPct: undefined,

        liquiditySignal: liquiditySignal(lpUsd),

        // Reference values from the best pair
        priceUsd,

        updatedAt: new Date().toISOString(),
        source: 'dexscreener',

        pairUrl: ref?.url,
        pairAddress: ref?.pairAddress,
        chainId: ref?.chainId,
        dexId: ref?.dexId,
      },
    });
  } catch {
    return NextResponse.json({
      state: {
        updatedAt: new Date().toISOString(),
        source: 'dexscreener',
      },
    });
  }
}
