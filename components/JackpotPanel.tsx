'use client';

import { useEffect, useState } from 'react';

const JACKPOT_XPOT = 1_000_000;

// Simple USD formatter
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
  const [change24h, setChange24h] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrice() {
      try {
        // TODO: replace "xpot" with your actual CoinGecko / API id
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=xpot&vs_currencies=usd&include_24hr_change=true',
          { next: { revalidate: 60 } } // cache for 60s
        );

        if (!res.ok) throw new Error('Failed to fetch price');
        const data = await res.json();

        const token = data.xpot; // 👈 change if your id is different
        setPriceUsd(token.usd);
        setChange24h(token.usd_24h_change);
      } catch (err) {
        console.error('Failed to load XPOT price', err);
        setPriceUsd(0); // fallback
        setChange24h(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrice();
  }, []);

  const jackpotUsd =
    priceUsd !== null ? JACKPOT_XPOT * priceUsd : null;

  const changeLabel =
    change24h !== null
      ? `${change24h >= 0 ? '+' : ''}${change24h.toFixed(1)}%`
      : null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            Today&apos;s jackpot
          </p>
          <div className="mt-1 flex flex-col">
            <span className="text-3xl font-semibold text-slate-50">
              {JACKPOT_XPOT.toLocaleString('en-US')} XPOT
            </span>
            <span className="mt-1 text-sm text-slate-400">
              {isLoading || jackpotUsd === null
                ? 'Loading live USD value…'
                : `${formatUsd(jackpotUsd)} (live)`}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {priceUsd !== null && (
            <span className="text-xs text-slate-400">
              1 XPOT ≈ {priceUsd.toFixed(6)} USD
            </span>
          )}

          {changeLabel && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                change24h! >= 0
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : 'bg-rose-500/10 text-rose-300'
              }`}
            >
              24h: {changeLabel}
            </span>
          )}
        </div>
      </div>

      {/* Small helper line under the numbers */}
      <p className="mt-3 text-xs text-slate-500">
        The jackpot is always fixed at 1,000,000 XPOT. Its USD value updates in real time
        with the market price.
      </p>
    </section>
  );
}
