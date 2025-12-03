// app/components/JackpotPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const JACKPOT_XPOT = 1_000_000;

// TEMP: you’re using PANDU for now – later swap to real XPOT mint
const XPOT_MINT =
  'So11111111111111111111111111111111111111112';

function formatUsd(value: number) {
  if (!Number.isFinite(value)) return '$0';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

// Simple milestone ladder for highlights
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
];

type JackpotPanelProps = {
  /** When true, shows "Draw locked" pill in the header */
  isLocked?: boolean;
};

export default function JackpotPanel({ isLocked }: JackpotPanelProps) {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [maxJackpotToday, setMaxJackpotToday] =
    useState<number | null>(null);
  const [justPumped, setJustPumped] = useState(false);
  const prevJackpot = useRef<number | null>(null);

  const todayKey = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `xpot_max_jackpot_${y}${m}${day}`;
  })();

  // Load max jackpot for today from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(todayKey);
    if (stored) {
      const num = Number(stored);
      if (!Number.isNaN(num)) setMaxJackpotToday(num);
    }
  }, [todayKey]);

  // Fast-updating Jupiter price (5s interval)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    async function fetchPrice() {
      try {
        const res = await fetch(
          `https://lite-api.jup.ag/price/v3?ids=${XPOT_MINT}`,
        );

        if (!res.ok) throw new Error('Jupiter price fetch failed');

        const json = (await res.json()) as Record<
          string,
          { usdPrice: number; priceChange24h?: number }
        >;

        const token = json[XPOT_MINT];
        const price = token?.usdPrice;

        if (typeof price === 'number') {
          setPriceUsd(price);
        } else {
          console.warn(
            'No usdPrice for token from Jupiter',
            json,
          );
        }
      } catch (e) {
        console.error('Price fetch error', e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrice();
    timer = setInterval(fetchPrice, 5_000);

    return () => clearInterval(timer);
  }, []);

  const jackpotUsd =
    priceUsd !== null ? JACKPOT_XPOT * priceUsd : null;

  // Track pump + max of the day
  useEffect(() => {
    if (jackpotUsd == null) return;

    if (
      prevJackpot.current !== null &&
      jackpotUsd > prevJackpot.current
    ) {
      setJustPumped(true);
      // slightly longer so glow feels smooth
      setTimeout(() => setJustPumped(false), 1600);
    }
    prevJackpot.current = jackpotUsd;

    if (typeof window !== 'undefined') {
      setMaxJackpotToday(prev => {
        const next =
          prev == null ? jackpotUsd : Math.max(prev, jackpotUsd);
        window.localStorage.setItem(todayKey, String(next));
        return next;
      });
    }
  }, [jackpotUsd, todayKey]);

  // Milestones
  const nextMilestone =
    jackpotUsd != null
      ? MILESTONES.find(m => jackpotUsd < m) ?? null
      : null;

  const reachedMilestone =
    jackpotUsd != null
      ? MILESTONES.filter(m => jackpotUsd >= m).slice(-1)[0] ??
        null
      : null;

  return (
    <section
      className={`
        relative overflow-hidden
        rounded-2xl border border-slate-800
        bg-slate-950/70 px-5 py-4 shadow-sm
        transition-colors duration-300
      `}
    >
      {/* Soft neon glow layer on price pump */}
      <div
        className={`
          pointer-events-none absolute inset-0 rounded-2xl
          border border-emerald-400/50
          shadow-[0_0_40px_rgba(52,211,153,0.45)]
          opacity-0 transition-opacity duration-500
          ${justPumped ? 'opacity-100' : ''}
        `}
      />

      <div className="relative flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          Today&apos;s XPOT
        </p>

        {isLocked && (
          <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200">
            Draw locked
          </span>
        )}
      </div>

      <div className="relative mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-semibold text-white">
            {JACKPOT_XPOT.toLocaleString()} XPOT
          </div>

          <div className="mt-1 text-sm text-slate-400">
            {isLoading
              ? 'Fetching live price…'
              : jackpotUsd
              ? `${formatUsd(jackpotUsd)} (live)`
              : 'Live price not available yet for this token on Jupiter.'}
          </div>

          {priceUsd && (
            <div className="mt-1 text-xs text-slate-500">
              1 XPOT ≈ ${priceUsd.toFixed(8)} (via Jupiter)
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 text-xs">
          {maxJackpotToday && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">
              Highest today: {formatUsd(maxJackpotToday)}
            </span>
          )}

          {reachedMilestone && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
              Milestone reached: {formatUsd(reachedMilestone)}
            </span>
          )}

          {nextMilestone && (
            <span className="text-slate-500">
              Next milestone at {formatUsd(nextMilestone)}
            </span>
          )}
        </div>
      </div>

      <p className="relative mt-3 text-xs text-slate-500">
        Today&apos;s XPOT round is fixed at 1,000,000 XPOT. Its USD value
        tracks real on-chain price from Jupiter and updates automatically.
      </p>
    </section>
  );
}
