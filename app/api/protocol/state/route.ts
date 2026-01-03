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

function pickBestPairForLink(pairs: DexPair[]): DexPair | null {
  if (!Array.isArray(pairs) || pairs.length === 0) return null;

  // Prefer Solana, then highest liquidity
  const sol = pairs.filter(p => (p.chainId || '').toLowerCase() === 'solana');
  const list = sol.length ? sol : pairs;

  list.sort((a, b) => (n(b.liquidity?.usd) ?? 0) - (n(a.liquidity?.usd) ?? 0));
  return list[0] ?? null;
}

function sumPairsUsd(pairs: DexPair[], getter: (p: DexPair) => number | undefined): number | undefined {
  if (!Array.isArray(pairs) || pairs.length === 0) return undefined;
  let sum = 0;
  let any = false;

  for (const p of pairs) {
    const v = getter(p);
    if (typeof v === 'number' && Number.isFinite(v)) {
      sum += v;
      any = true;
    }
  }

  return any ? sum : undefined;
}

function liquiditySignal(lpUsd?: number) {
  if (!Number.isFinite(Number(lpUsd))) return undefined;
  if ((lpUsd ?? 0) >= 100_000) return 'HEALTHY' as const;
  if ((lpUsd ?? 0) >= 20_000) return 'WATCH' as const;
  return 'CRITICAL' as const;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const mint =
    searchParams.get('mint') ||
    process.env.NEXT_PUBLIC_XPOT_MINT ||
    process.env.NEXT_PUBLIC_XPOT_CA ||
    process.env.XPOT_MINT ||
    '';

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
    const pairsRaw = Array.isArray(j?.pairs) ? j.pairs : [];

    // Prefer Solana pairs for totals. If none exist, fall back to whatever pairs exist.
    const solPairs = pairsRaw.filter(p => (p.chainId || '').toLowerCase() === 'solana');
    const pairs = solPairs.length ? solPairs : pairsRaw;

    // ✅ Birdeye-style totals: combine ALL LPs + ALL volume across relevant pairs
    const lpUsdTotal = sumPairsUsd(pairs, p => n(p.liquidity?.usd));
    const volume24hUsdTotal = sumPairsUsd(pairs, p => n(p.volume?.h24));

    // Price should come from the deepest pair (for best price quality)
    const best = pickBestPairForLink(pairs);

    const priceUsd = n(best?.priceUsd);

    return NextResponse.json({
      state: {
        // totals
        lpUsd: lpUsdTotal,
        volume24hUsd: volume24hUsdTotal,
        pairsCount: pairs.length,

        // optional until you implement history
        lpChange24hPct: undefined,
        liquiditySignal: liquiditySignal(lpUsdTotal),

        priceUsd,

        updatedAt: new Date().toISOString(),
        source: 'dexscreener',

        // best-pair link metadata (keeps your "View chart" working)
        pairUrl: best?.url,
        pairAddress: best?.pairAddress,
        chainId: best?.chainId,
        dexId: best?.dexId,
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
