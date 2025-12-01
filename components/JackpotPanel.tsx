'use client';

import { useEffect, useState } from 'react';

const JACKPOT_XPOT = 1_000_000;

// 🔴 PUT YOUR ACTUAL MINT ADDRESS HERE
const XPOT_MINT = '4NGbC4RRrUjS78ooSN53Up7gSg4dGrj6F6dxpMWHbonk';

function formatUsd(value: number) {
  if (!Number.isFinite(value)) return '$0';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export default function JackpotPanel() {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    async function fetchPrice() {
      try {
        const res = await fetch(
          `https://price.jup.ag/v6/price?ids=${XPOT_MINT}`
        );

        if (!res.ok) throw new Error('Jupiter price fetch failed');
        const json = await res.json();

        const token = json?.data?.[XPOT_MINT];
        const price = token?.price;

        if (typeof price === 'number') {
          setPriceUsd(price);
        }
      } catch (e) {
        console.error('Price fetch error', e);
        setPriceUsd(null);
      } finally {
        setIsLoading(false);
      }
    }

    // Initial fetch
    fetchPrice();

    // Refresh every 60 seconds
    timer = setInterval(fetchPrice, 60_000);

    return () => clearInterval(timer);
  }, []);

  const jackpotUsd =
    priceUsd !== null ? JACKPOT_XPOT * priceUsd : null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
        Today&apos;s Jackpot
      </p>

      <div className="mt-2">
        <div className="text-3xl font-semibold text-white">
          {JACKPOT_XPOT.toLocaleString()} XPOT
        </div>

        <div className="mt-1 text-sm text-slate-400">
          {isLoading
            ? 'Fetching live price…'
            : jackpotUsd
            ? `${formatUsd(jackpotUsd)} (live)`
            : 'Live price unavailable'}
        </div>

        {priceUsd && (
          <div className="mt-1 text-xs text-slate-500">
            1 XPOT ≈ ${priceUsd.toFixed(6)} USD (via Jupiter)
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Jackpot value updates based on real on-chain liquidity via Jupiter.
      </p>
    </section>
  );
}
