// app/components/JackpotPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const JACKPOT_XPOT = 1_000_000;

function formatUsd(value: number) {
  if (!Number.isFinite(value)) return '$0';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

// Milestones in USD for the full 1,000,000 XPOT pool
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

type PriceResponse = {
  ok: boolean;
  priceUsd: number | null;
  error?: string;
};

export default function JackpotPanel({ isLocked }: JackpotPanelProps) {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [maxJackpotToday, setMaxJackpotToday] =
    useState<number | null>(null);
  const [justPumped, setJustPumped] = useState(false);
  const prevJackpot = useRef<number | null>(null);

  // Local-storage key for today's “highest jackpot” badge
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

  // Fetch live XPOT price from our API (single source of truth)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function fetchPrice() {
      try {
        const res = await fetch('/api/xpot/price', { cache: 'no-store' });
        if (!res.ok) {
          console.error('[XPOT] /api/xpot/price HTTP error', res.status);
          setPriceUsd(null);
          return;
        }

        const data = (await res.json()) as PriceResponse;

        if (typeof data.priceUsd === 'number' && Number.isFinite(data.priceUsd)) {
          setPriceUsd(data.priceUsd);
        } else {
          console.warn('[XPOT] priceUsd missing in API response', data);
          setPriceUsd(null);
        }
      } catch (e) {
        console.error('[XPOT] /api/xpot/price fetch failed', e);
        setPriceUsd(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrice();
    // Update every 15s – same pace as admin card
    timer = setInterval(fetchPrice, 15_000);

    return () => clearInterval(timer);
  }, []);

  const jackpotUsd =
    priceUsd != null ? JACKPOT_XPOT * priceUsd : null;

  // Track pump + max of the day
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

  // Milestones
  const nextMilestone =
    jackpotUsd != null
      ? MILESTONES.find(m => jackpotUsd < m) ?? null
      : null;

  const reachedMilestone =
    jackpotUsd != null
      ? MILESTONES.filter(m => jackpotUsd >= m).slice(-1)[0] ?? null
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

          {priceUsd != null && (
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
        tracks real on-chain price for the active XPOT token via Jupiter
        and updates automatically.
      </p>
    </section>
  );
}
