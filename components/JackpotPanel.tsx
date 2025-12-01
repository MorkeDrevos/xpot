'use client';

import { useEffect, useRef, useState } from 'react';

const JACKPOT_XPOT = 1_000_000;
// you already set this, keep your value:
const XPOT_MINT = '4NGbC4RRrUjS78ooSN53Up7gSg4dGrj6F6dxpMWHbonk';

function formatUsd(value: number) {
  if (!Number.isFinite(value)) return '$0';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

// Simple milestone ladder for highlights
const MILESTONES = [10_000, 25_000, 50_000, 100_000, 250_000, 1_000_000];

export default function JackpotPanel() {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [maxJackpotToday, setMaxJackpotToday] = useState<number | null>(null);
  const [justPumped, setJustPumped] = useState(false);
  const prevJackpot = useRef<number | null>(null);

  const todayKey = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `xpot_max_jackpot_${y}${m}${day}`;
  })();

  useEffect(() => {
    // Load today's max from localStorage
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(todayKey);
    if (stored) {
      const num = Number(stored);
      if (!isNaN(num)) setMaxJackpotToday(num);
    }
  }, [todayKey]);

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
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrice();
    timer = setInterval(fetchPrice, 60_000);

    return () => clearInterval(timer);
  }, []);

  const jackpotUsd =
    priceUsd !== null ? JACKPOT_XPOT * priceUsd : null;

  // Track pump + max of the day
  useEffect(() => {
    if (jackpotUsd == null) return;

    // detect pump
    if (prevJackpot.current !== null && jackpotUsd > prevJackpot.current) {
      setJustPumped(true);
      setTimeout(() => setJustPumped(false), 1200);
    }
    prevJackpot.current = jackpotUsd;

    // update today's max
    if (typeof window !== 'undefined') {
      setMaxJackpotToday((prev) => {
        const next = prev == null ? jackpotUsd : Math.max(prev, jackpotUsd);
        window.localStorage.setItem(todayKey, String(next));
        return next;
      });
    }
  }, [jackpotUsd, todayKey]);

  // Find next milestone
  const nextMilestone =
    jackpotUsd != null
      ? MILESTONES.find((m) => jackpotUsd < m) ?? null
      : null;

  const reachedMilestone =
    jackpotUsd != null
      ? MILESTONES.filter((m) => jackpotUsd >= m).slice(-1)[0] ?? null
      : null;

  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 shadow-sm transition ${
        justPumped ? 'ring-2 ring-emerald-400/60 animate-pulse' : ''
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
        Today&apos;s Jackpot
      </p>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
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
              1 XPOT ≈ ${priceUsd.toFixed(6)} (via Jupiter)
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

      <p className="mt-3 text-xs text-slate-500">
        Jackpot is fixed at 1,000,000 XPOT. Its USD value tracks real on-chain price from
        Jupiter and updates automatically.
      </p>
    </section>
  );
}
