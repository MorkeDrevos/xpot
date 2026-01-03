// components/JackpotPanel/utils/dex.ts

export type DexMetrics = {
  priceUsd: number | null;
  changeH1: number | null;
};

export function readDexScreenerMetrics(payload: unknown): DexMetrics {
  if (!payload || typeof payload !== 'object') return { priceUsd: null, changeH1: null };
  const p: any = payload;
  const pairs = Array.isArray(p?.pairs) ? p.pairs : [];
  if (!pairs.length) return { priceUsd: null, changeH1: null };

  // Prefer Solana + highest liquidity
  let best: any = null;
  for (const pair of pairs) {
    const priceUsd = Number(pair?.priceUsd ?? NaN);
    if (!Number.isFinite(priceUsd)) continue;

    if (!best) {
      best = pair;
      continue;
    }

    const chainOk = (pair?.chainId ?? '').toString().toLowerCase() === 'solana';
    const bestChainOk = (best?.chainId ?? '').toString().toLowerCase() === 'solana';

    const liqUsd = Number(pair?.liquidity?.usd ?? 0);
    const bestLiq = Number(best?.liquidity?.usd ?? 0);

    const better = (chainOk && !bestChainOk) || liqUsd > bestLiq;
    if (better) best = pair;
  }

  const outPrice = Number(best?.priceUsd ?? NaN);
  const outChange = Number(best?.priceChange?.h1 ?? NaN);

  return {
    priceUsd: Number.isFinite(outPrice) ? outPrice : null,
    changeH1: Number.isFinite(outChange) ? outChange : null,
  };
}
