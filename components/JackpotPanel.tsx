// components/JackpotPanel.tsx
'use client';

import { useEffect, useState } from 'react';

type JackpotPanelProps = {
  isLocked?: boolean;
};

function formatUsd(amount: number | null | undefined) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '$0.00';

  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUsdSmall(amount: number | null | undefined, decimals = 6) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '$0.000000';

  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const JACKPOT_XPOT = 1_000_000;

export default function JackpotPanel({ isLocked }: JackpotPanelProps) {
  const [pricePerToken, setPricePerToken] = useState<number | null>(null);
  const [jackpotUsd, setJackpotUsd] = useState<number | null>(null);
  const [highestUsd, setHighestUsd] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Single source of truth: /api/xpot/price (which already uses TOKEN_MINT)
  useEffect(() => {
    let mounted = true;

    async function loadPrice() {
      try {
        const res = await fetch('/api/xpot/price', { cache: 'no-store' });
        if (!res.ok) {
          if (!mounted) return;
          setError('Live price not available yet.');
          return;
        }

        const data = await res.json();
        const price = data.priceUsd as number | undefined;

        if (typeof price !== 'number' || Number.isNaN(price)) {
          if (!mounted) return;
          setError('Live price not available yet.');
          return;
        }

        const jp = price * JACKPOT_XPOT;

        if (!mounted) return;

        setPricePerToken(price);
        setJackpotUsd(jp);
        setError(null);

        setHighestUsd(prev => {
          if (prev == null) return jp;
          return jp > prev ? jp : prev;
        });
      } catch (err) {
        if (!mounted) return;
        console.error('[JackpotPanel] price fetch failed', err);
        setError('Live price not available yet.');
      }
    }

    loadPrice();
    const id = window.setInterval(loadPrice, 15_000);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const jackpotLabel = jackpotUsd != null ? formatUsd(jackpotUsd) : '$0.00';
  const perTokenLabel =
    pricePerToken != null ? formatUsdSmall(pricePerToken, 8) : '$0.00000000';
  const highestLabel =
    highestUsd != null ? formatUsd(highestUsd) : 'Waiting for price…';

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 shadow-lg shadow-black/40">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Today&apos;s XPOT
          </p>
          <p className="mt-1 text-xs text-slate-400">
            XPOT ticket pool is fixed at 1,000,000 XPOT. USD value updates live
            from on-chain price via Jupiter.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          {highestUsd != null && (
            <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
              <span className="mr-1 text-[10px] uppercase tracking-[0.16em] text-emerald-300">
                Highest today
              </span>
              <span className="font-mono">{highestLabel}</span>
            </span>
          )}
          {isLocked && (
            <span className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/90 px-3 py-1 text-[11px] text-slate-300">
              XPOT round locked
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            1,000,000 XPOT
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-50 sm:text-4xl">
            {jackpotLabel}{' '}
            <span className="align-middle text-xs font-normal text-emerald-300">
              (live)
            </span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            1 XPOT ≈{' '}
            <span className="font-mono text-emerald-300">
              {perTokenLabel}
            </span>{' '}
            <span className="text-slate-500">(via Jupiter)</span>
          </p>
        </div>

        <div className="text-xs text-slate-400 sm:text-right">
          {error ? (
            <p className="text-amber-300">{error}</p>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                Live XPOT tracking
              </p>
              <p className="mt-1 max-w-xs text-slate-400">
                Price updates approximately every 15 seconds from Jupiter using
                the active XPOT token mint.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
