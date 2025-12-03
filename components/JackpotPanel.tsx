// app/components/JackpotPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { TOKEN_MINT, XPOT_POOL_SIZE } from '@/lib/xpot';

type JackpotPanelProps = {
  isLocked?: boolean;
};

function formatUsd(value: number | null) {
  if (value == null || !Number.isFinite(value)) return '$0.00';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MILESTONES = [
  100,
  500,
  5_000,
  10_000,
  25_000,
  50_000,
  100_000,
  250_000,
  1_000_000,
  2_000_000,
  5_000_000,
  10_000_000,
];

export default function JackpotPanel({ isLocked }: JackpotPanelProps) {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);
  const [maxJackpotToday, setMaxJackpotToday] = useState<number | null>(null);
  const [justPumped, setJustPumped] = useState(false);
  const prevJackpot = useRef<number | null>(null);

  const todayKey = (() => {
    const d = new Date();
    return `xpot_max_${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`;
  })();

  useEffect(() => {
    const stored = localStorage.getItem(todayKey);
    if (stored) {
      const n = Number(stored);
      if (!Number.isNaN(n)) setMaxJackpotToday(n);
    }
  }, [todayKey]);

  // ✅ Jupiter direct (single source)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function fetchPrice() {
      try {
        setHadError(false);

        const res = await fetch(
          `https://lite-api.jup.ag/price/v3?ids=${TOKEN_MINT}`,
        );
        if (!res.ok) throw new Error('Jupiter failed');

        const json = await res.json();
        const token = json[TOKEN_MINT];
        const price = token?.usdPrice;

        if (typeof price === 'number') {
          setPriceUsd(price);
        } else {
          throw new Error('No price returned');
        }
      } catch (e) {
        console.error('[XPOT] Price error', e);
        setPriceUsd(null);
        setHadError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrice();
    timer = setInterval(fetchPrice, 5_000);
    return () => clearInterval(timer);
  }, []);

  const jackpotUsd =
    priceUsd !== null ? XPOT_POOL_SIZE * priceUsd : null;

  // Track pump + highest today
  useEffect(() => {
    if (jackpotUsd == null) return;

    if (prevJackpot.current && jackpotUsd > prevJackpot.current) {
      setJustPumped(true);
      setTimeout(() => setJustPumped(false), 1500);
    }

    prevJackpot.current = jackpotUsd;

    setMaxJackpotToday(prev => {
      const next = prev == null ? jackpotUsd : Math.max(prev, jackpotUsd);
      localStorage.setItem(todayKey, String(next));
      return next;
    });
  }, [jackpotUsd, todayKey]);

  const reached = jackpotUsd ? MILESTONES.filter(m => jackpotUsd >= m).slice(-1)[0] : null;
  const next = jackpotUsd ? MILESTONES.find(m => jackpotUsd < m) ?? null : null;

  const unavailable = !isLoading && (hadError || jackpotUsd == null);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 px-6 py-5 shadow-sm">
      {/* Glow */}
      <div
        className={`absolute inset-0 rounded-2xl border border-emerald-400/40 shadow-[0_0_40px_rgba(52,211,153,0.4)] transition-opacity ${
          justPumped ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Header */}
      <div className="relative flex justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Today&apos;s XPOT
          </p>
          <p className="mt-1 text-xs text-slate-400">
            XPOT ticket pool is fixed at {XPOT_POOL_SIZE.toLocaleString()} XPOT. USD updates from Jupiter.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          {isLocked && (
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-200">
              Draw locked
            </span>
          )}
          {unavailable && (
            <span className="text-[11px] font-semibold text-amber-300">
              Live price not available yet
            </span>
          )}
        </div>
      </div>

      {/* Main Value */}
      <div className="relative mt-4 flex justify-between">
        <div>
          <div className="text-sm tracking-[0.18em] text-slate-400">
            {XPOT_POOL_SIZE.toLocaleString()} XPOT
          </div>
          <div className="mt-1 text-4xl font-semibold text-white">
            {formatUsd(jackpotUsd)}
            <span className="ml-2 text-sm text-emerald-400">(live)</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            1 XPOT ≈ {priceUsd ? priceUsd.toFixed(8) : '0.00000000'} (via Jupiter)
          </div>
        </div>

        {/* Pills */}
        <div className="flex flex-col items-end gap-1 text-xs">
          {maxJackpotToday && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">
              Highest today: {formatUsd(maxJackpotToday)}
            </span>
          )}

          {reached && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
              Milestone: {formatUsd(reached)}
            </span>
          )}

          {next && (
            <span className="text-slate-500">
              Next at {formatUsd(next)}
            </span>
          )}
        </div>
      </div>

      <p className="relative mt-3 text-xs text-slate-500">
        Price updates every 5 seconds. Jackpot value is always derived from the same Jupiter feed.
      </p>
    </section>
  );
}
