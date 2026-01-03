// components/JackpotPanel/hooks/useDexScreenerPrice.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { readDexScreenerMetrics, type DexMetrics } from '../utils/dex';

export function useDexScreenerPrice(tokenMint: string, pollMs: number) {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [momentumGlobalH1, setMomentumGlobalH1] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);

  const [justUpdated, setJustUpdated] = useState(false);
  const updatePulseTimeout = useRef<number | null>(null);

  useEffect(() => {
    let timer: number | null = null;
    let aborted = false;
    const ctrl = new AbortController();

    async function fetchFromDexScreener(): Promise<DexMetrics> {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      });
      if (!res.ok) return { priceUsd: null, changeH1: null };
      const json = await res.json();
      return readDexScreenerMetrics(json);
    }

    async function fetchPrice() {
      try {
        setHadError(false);

        const dexMetrics = await fetchFromDexScreener();

        if (!aborted && dexMetrics.changeH1 != null) {
          setMomentumGlobalH1(dexMetrics.changeH1);
        }

        const price =
          typeof dexMetrics.priceUsd === 'number' && Number.isFinite(dexMetrics.priceUsd)
            ? dexMetrics.priceUsd
            : null;

        if (aborted) return;

        if (price != null) {
          setPriceUsd(price);
          setJustUpdated(true);

          if (updatePulseTimeout.current !== null) window.clearTimeout(updatePulseTimeout.current);
          updatePulseTimeout.current = window.setTimeout(() => setJustUpdated(false), 420);
        } else {
          setPriceUsd(null);
          setHadError(true);
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        console.error('[XPOT] DexScreener price error:', err);
        if (aborted) return;
        setPriceUsd(null);
        setHadError(true);
      } finally {
        if (!aborted) setIsLoading(false);
      }
    }

    function onVis() {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') fetchPrice();
    }

    fetchPrice();
    timer = window.setInterval(fetchPrice, pollMs);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }

    return () => {
      aborted = true;
      ctrl.abort();
      if (timer !== null) window.clearInterval(timer);
      if (updatePulseTimeout.current !== null) window.clearTimeout(updatePulseTimeout.current);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
    };
  }, [tokenMint, pollMs]);

  return { priceUsd, momentumGlobalH1, isLoading, hadError, justUpdated };
}
