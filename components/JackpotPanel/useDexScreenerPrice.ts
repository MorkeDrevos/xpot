// components/JackpotPanel/useDexScreenerPrice.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { TOKEN_MINT } from '@/lib/xpot';
import { PRICE_POLL_MS, readDexScreenerMetrics } from './utils';
import type { DexMetrics } from './types';

/**
 * DexScreener live price hook
 * - Backwards compatible: can be called with NO args (uses TOKEN_MINT + PRICE_POLL_MS)
 * - Or override: useDexScreenerPrice(customMint, customPollMs)
 */
export function useDexScreenerPrice(tokenMint: string = TOKEN_MINT, pollMs: number = PRICE_POLL_MS) {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [momentumGlobalH1, setMomentumGlobalH1] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);

  const [justUpdated, setJustUpdated] = useState(false);
  const updatePulseTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

        if (!aborted) {
          setMomentumGlobalH1(dexMetrics.changeH1 ?? null);
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

    if (Number.isFinite(pollMs) && pollMs > 0) {
      timer = window.setInterval(fetchPrice, pollMs);
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }

    return () => {
      aborted = true;
      ctrl.abort();

      if (timer !== null) window.clearInterval(timer);

      if (updatePulseTimeout.current !== null) {
        window.clearTimeout(updatePulseTimeout.current);
        updatePulseTimeout.current = null;
      }

      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, [tokenMint, pollMs]);

  return { priceUsd, momentumGlobalH1, isLoading, hadError, justUpdated };
}
