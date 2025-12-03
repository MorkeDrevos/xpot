// app/components/JackpotPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { TOKEN_MINT, XPOT_POOL_SIZE } from '@/lib/xpot';

const JACKPOT_XPOT = XPOT_POOL_SIZE;

type JackpotPanelProps = {
  isLocked?: boolean;
};

function formatUsd(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '$0.00';
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

  // pool label for all text
  const poolLabel = JACKPOT_XPOT.toLocaleString('en-US');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(todayKey);
    if (stored) {
      const num = Number(stored);
      if (!Number.isNaN(num)) setMaxJackpotToday(num);
    }
  }, [todayKey]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function fetchPrice() {
      try {
        setHadError(false);

        const res = await fetch(
          `https://lite-api.jup.ag/price/v3?ids=${TOKEN_MINT}`,
        );
        if (!res.ok) throw new Error('Jupiter price fetch failed');

        const json = (await res.json()) as Record<
          string,
          { usdPrice: number }
        >;

        const token = json[TOKEN_MINT];
        const price = token?.usdPrice;

        if (typeof price === 'number' && !Number.isNaN(price)) {
          setPriceUsd(price);
        } else {
          setPriceUsd(null);
          setHadError(true);
        }
      } catch (err) {
        console.error('[XPOT] Jupiter price error:', err);
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
    priceUsd !== null ? JACKPOT_XPOT * priceUsd : null;

  useEffect(() => {
    if (jackpotUsd == null) return;

    if (
      prevJackpot.current !== null &&
      jackpotUsd > prevJackpot.current
    ) {
      setJustPumped(true);
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

  const reachedMilestone =
    jackpotUsd != null
      ? MILESTONES.filter(m => jackpotUsd >= m).slice(-1)[0] ??
        null
      : null;

  const nextMilestone =
    jackpotUsd != null
      ? MILESTONES.find(m => jackpotUsd < m) ?? null
      : null;

  const showUnavailable =
    !isLoading && (jackpotUsd === null || hadError || priceUsd === null);

  return (
    <section
      className="
        relative overflow-hidden
        rounded-2xl border border-slate-800
        bg-slate-950/70 px-5 py-4 shadow-sm
        transition-colors duration-300
      "
    >
      {/* Soft neon glow on pump */}
      <div
        className={`
          pointer-events-none absolute inset-0 rounded-2xl
          border border-emerald-400/50
          shadow-[0_0_40px_rgba(52,211,153,0.45)]
          opacity-0 transition-opacity duration-500
          ${justPumped ? 'opacity-100' : ''}
        `}
      />

      {/* HEADER */}
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Today&apos;s XPOT
          </p>
          <p className="mt-1 text-xs text-slate-400">
            XPOT ticket pool is fixed at {poolLabel} XPOT. USD value updates
            live from on-chain price via Jupiter.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          {isLocked && (
            <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200">
              Draw locked
            </span>
          )}

          {showUnavailable && (
            <span className="text-[11px] font-semibold text-amber-300">
              Live price not available yet.
            </span>
          )}
        </div>
      </div>

      {/* MAIN NUMBERS */}
      <div className="relative mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[0.18em] text-slate-400">
            {poolLabel} XPOT
          </p>

          <div className="mt-1 text-4xl font-semibold text-white">
            {formatUsd(jackpotUsd)}
            <span className="ml-1 align-middle text-sm text-emerald-400">
              (live)
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            1 XPOT ≈{' '}
            <span className="font-mono">
              {priceUsd !== null ? priceUsd.toFixed(8) : '0.00000000'}
            </span>{' '}
            <span className="text-slate-500">(via Jupiter)</span>
          </p>
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
        Today&apos;s XPOT round is fixed at {poolLabel} XPOT. Its USD value
        tracks real on-chain price from Jupiter and updates automatically.
      </p>
    </section>
  );
}
