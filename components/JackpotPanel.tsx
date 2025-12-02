// components/JackpotPanel.tsx
'use client';

import { useEffect, useState } from 'react';

// Helpers
function formatUsd(amount: number | null | undefined) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '0.00';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUsdPrice(amount: number | null | undefined) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '0.00000';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  });
}

function UsdPill({ amount }: { amount: number | null }) {
  return (
    <span className="inline-flex items-baseline rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
      <span className="font-mono text-sm">{formatUsd(amount)}</span>
      <span className="ml-1 text-[10px] uppercase tracking-[0.16em] text-emerald-400">
        USD
      </span>
    </span>
  );
}

export default function JackpotPanel({ isLocked }: { isLocked: boolean }) {
  const [pricePerXpot, setPricePerXpot] = useState<number | null>(null);
  const [jackpotUsd, setJackpotUsd] = useState<number | null>(null);
  const [highestUsdToday, setHighestUsdToday] = useState<number | null>(33); // demo
  const [nextMilestoneUsd, setNextMilestoneUsd] = useState<number | null>(500); // demo

  useEffect(() => {
    async function loadPrice() {
      try {
        const res = await fetch('/api/xpot/price', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        const price = typeof data.priceUsd === 'number' ? data.priceUsd : null;
        setPricePerXpot(price);

        if (price !== null) {
          setJackpotUsd(price * 1_000_000);
        }
      } catch (err) {
        console.error('[XPOTPanel] price fetch failed', err);
      }
    }

    loadPrice();
    const id = window.setInterval(loadPrice, 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          {/* Label */}
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Today&apos;s XPOT
          </p>

          {/* MAIN: XPOT amount */}
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-50 sm:text-3xl">
            1,000,000.00
          </p>

          {/* Live USD value */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <UsdPill amount={jackpotUsd} />
            <span className="text-[11px] text-slate-500">(live)</span>
          </div>

          {/* Per-XPOT price in USD */}
          <p className="mt-2 text-xs text-slate-500">
            1 XPOT ≈{' '}
            <span className="font-mono text-slate-200">
              {formatUsdPrice(pricePerXpot)}
            </span>{' '}
            USD <span className="text-slate-600">(via Jupiter)</span>
          </p>

          {/* Description */}
          <p className="mt-3 text-xs text-slate-400">
            Allocation amount is fixed at 1,000,000 XPOT. Its USD value follows
            live on-chain pricing from Jupiter and updates automatically.
          </p>
        </div>

        {/* Side badges (highest & milestone) */}
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300">
            <span className="mr-1 text-slate-500">Highest today:</span>
            <span className="font-mono">
              {formatUsd(highestUsdToday)}{' '}
              <span className="text-[10px]">USD</span>
            </span>
          </div>
          <div className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300">
            <span className="mr-1 text-slate-500">Next milestone at</span>
            <span className="font-mono">
              {formatUsd(nextMilestoneUsd)}{' '}
              <span className="text-[10px]">USD</span>
            </span>
          </div>
          {isLocked && (
            <div className="mt-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Draw locked
            </div>
          )}
        </div>
      </header>
    </section>
  );
}
