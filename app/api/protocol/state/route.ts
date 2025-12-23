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

function pickBestPair(pairs: DexPair[]): DexPair | null {
  if (!Array.isArray(pairs) || pairs.length === 0) return null;

  // Prefer Solana, then highest liquidity USD
  const sol = pairs.filter(p => (p.chainId || '').toLowerCase() === 'solana');
  const list = sol.length ? sol : pairs;

  list.sort((a, b) => (n(b.liquidity?.usd) ?? 0) - (n(a.liquidity?.usd) ?? 0));
  return list[0] ?? null;
}

function liquiditySignal(lpUsd?: number) {
  // Tune these thresholds whenever you want
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
    // Dexscreener token endpoint (works well for quick live testing)
    const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`;

    const r = await fetch(url, {
      cache: 'no-store',
      // Avoid Next caching surprises
      headers: { 'accept': 'application/json' },
    });

    if (!r.ok) {
      // Non-fatal: treat as "no public pair yet"
      return NextResponse.json({
        state: {
          updatedAt: new Date().toISOString(),
          source: 'dexscreener',
        },
      });
    }

    const j = (await r.json().catch(() => ({}))) as { pairs?: DexPair[] };
    const best = pickBestPair(Array.isArray(j?.pairs) ? j.pairs : []);

    const lpUsd = n(best?.liquidity?.usd);
    const priceUsd = n(best?.priceUsd);
    const volume24hUsd = n(best?.volume?.h24);

    return NextResponse.json({
      state: {
        lpUsd,
        // Optional until you implement sampling/history
        lpChange24hPct: undefined,
        liquiditySignal: liquiditySignal(lpUsd),

        priceUsd,
        volume24hUsd,

        updatedAt: new Date().toISOString(),
        source: 'dexscreener',

        pairUrl: best?.url,
        pairAddress: best?.pairAddress,
        chainId: best?.chainId,
        dexId: best?.dexId,
      },
    });
  } catch {
    // Non-fatal: page already handles protoError gracefully
    return NextResponse.json({
      state: {
        updatedAt: new Date().toISOString(),
        source: 'dexscreener',
      },
    });
  }
}
