// app/components/JackpotPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { TOKEN_MINT, XPOT_POOL_SIZE } from '@/lib/xpot';

const JACKPOT_XPOT = XPOT_POOL_SIZE;
const PRICE_POLL_MS = 2000; // 2s – feels live without hammering Jupiter

type JackpotPanelProps = {
  /** When true, shows "Draw locked" pill in the header */
  isLocked?: boolean;
  /** Called whenever the live USD XPOT value updates */
  onJackpotUsdChange?: (value: number | null) => void;
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

// Milestone ladder for highlights (USD)
const MILESTONES = [
  // Micro engagement
  25,
  50,
  75,
  100,

  // Early activation
  150,
  200,
  300,
  400,
  500,

  // Momentum zone
  750,
  1_000,
  1_500,
  2_000,
  3_000,
  4_000,
  5_000,

  // Growth phase
  7_500,
  10_000,
  15_000,
  20_000,
  30_000,
  40_000,
  50_000,

  // Serious money
  75_000,
  100_000,
  150_000,
  200_000,
  300_000,
  400_000,
  500_000,

  // Prestige tier
  750_000,
  1_000_000,
  1_500_000,
  2_000_000,
  3_000_000,
  5_000_000,
  10_000_000,
];

/**
 * "Session" key that flips at 22:00 Madrid time.
 * We add 2 hours to Madrid time and then take the calendar date,
 * so the session rolls over when the daily XPOT resets.
 */
function getMadridSessionKey() {
  const now = new Date();
  const madridNow = new Date(
    now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }),
  );
  madridNow.setHours(madridNow.getHours() + 2); // shift so date changes at 22:00
  const year = madridNow.getFullYear();
  const month = String(madridNow.getMonth() + 1).padStart(2, '0');
  const day = String(madridNow.getDate()).padStart(2, '0');
  return `${year}${month}${day}`; // e.g. 20251204
}

export default function JackpotPanel({
  isLocked,
  onJackpotUsdChange,
}: JackpotPanelProps) {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);

  const [maxJackpotToday, setMaxJackpotToday] =
    useState<number | null>(null);

  const [justPumped, setJustPumped] = useState(false);
  const prevJackpot = useRef<number | null>(null);

  // tiny pulse when price updates
  const [justUpdated, setJustUpdated] = useState(false);
  const updatePulseTimeout = useRef<number | null>(null);

  // Session key for "highest this session" (22:00 Madrid cut)
  const sessionKey = `xpot_max_session_usd_${getMadridSessionKey()}`;

  // Load max XPOT USD value for *this* Madrid session from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(sessionKey);
    if (stored) {
      const num = Number(stored);
      if (!Number.isNaN(num)) setMaxJackpotToday(num);
    } else {
      setMaxJackpotToday(null);
    }
  }, [sessionKey]);

  // Live price from Jupiter (direct)
  useEffect(() => {
    let timer: number | null = null;

    async function fetchPrice() {
      try {
        setHadError(false);

        const res = await fetch(
          `https://lite-api.jup.ag/price/v3?ids=${TOKEN_MINT}`,
        );
        if (!res.ok) throw new Error('Jupiter price fetch failed');

        const json = (await res.json()) as Record<
          string,
          { usdPrice: number; priceChange24h?: number }
        >;

        const token = json[TOKEN_MINT];
        const price = token?.usdPrice;

        if (typeof price === 'number' && !Number.isNaN(price)) {
          setPriceUsd(price);

          // soft “live” pulse when price changes
          setJustUpdated(true);
          if (updatePulseTimeout.current !== null) {
            window.clearTimeout(updatePulseTimeout.current);
          }
          updatePulseTimeout.current = window.setTimeout(() => {
            setJustUpdated(false);
          }, 400);
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
    timer = window.setInterval(fetchPrice, PRICE_POLL_MS);

    return () => {
      if (timer !== null) {
        window.clearInterval(timer);
      }
      if (updatePulseTimeout.current !== null) {
        window.clearTimeout(updatePulseTimeout.current);
      }
    };
  }, []);

  const jackpotUsd =
    priceUsd !== null ? JACKPOT_XPOT * priceUsd : null;

  // Track pumps and "highest this session" + notify parent
  useEffect(() => {
    // notify admin/home page about the new value
    if (typeof onJackpotUsdChange === 'function') {
      onJackpotUsdChange(jackpotUsd);
    }

    if (jackpotUsd == null) return;

    // Pump flash
    if (
      prevJackpot.current !== null &&
      jackpotUsd > prevJackpot.current
    ) {
      setJustPumped(true);
      setTimeout(() => setJustPumped(false), 1600);
    }
    prevJackpot.current = jackpotUsd;

    // Store highest XPOT USD value of the current session
    if (typeof window !== 'undefined') {
      setMaxJackpotToday(prev => {
        const next =
          prev == null ? jackpotUsd : Math.max(prev, jackpotUsd);
        window.localStorage.setItem(sessionKey, String(next));
        return next;
      });
    }
  }, [jackpotUsd, sessionKey, onJackpotUsdChange]);

  // Milestones (based on current live XPOT USD value)
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

  const poolLabel = `${JACKPOT_XPOT.toLocaleString()} XPOT`;
  const displayUsd =
    jackpotUsd === null ? '—' : formatUsd(jackpotUsd);

  return (
    <section
      className={`
        relative
        rounded-2xl border border-slate-800
        bg-slate-950/70 px-5 py-4 shadow-sm
        transition-colors duration-300
      `}
    >
      {/* Soft neon glow on pump */}
      <div
        className={`
          pointer-events-none absolute inset-0 rounded-2xl
          border border-emerald-400/40
          shadow-[0_0_40px_rgba(52,211,153,0.45)]
          opacity-0 transition-opacity duration-500
          ${justPumped ? 'opacity-100' : ''}
        `}
      />

      {/* HEADER */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-2">
          {/* Section label */}
          <span className="inline-flex rounded-full bg-emerald-500/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Today&apos;s XPOT
          </span>

          {/* Fixed pool size – premium pill */}
          <span className="inline-flex items-baseline rounded-xl bg-black/40 px-4 py-2 font-mono text-lg tracking-[0.16em] text-slate-100 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
            {poolLabel}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 text-xs">
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
      <div className="relative z-10 mt-6 flex flex-wrap items-end justify-between gap-6">
        {/* Left: live USD value + XPOT price */}
        <div className="space-y-3">
          {/* Big USD number with pill + tooltip on the side */}
          <div className="flex flex-wrap items-end gap-3">
            <div
              className={`
                text-5xl sm:text-6xl font-semibold
                tabular-nums
                transition-transform transition-colors duration-200
                ${justUpdated ? 'scale-[1.01]' : ''}
                ${justPumped ? 'text-emerald-300' : 'text-white'}
              `}
            >
              {displayUsd}
            </div>

            {/* USD estimate pill + tooltip trigger */}
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/25 bg-black/40 px-2.5 py-[5px] text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75">
                USD estimate
              </span>

              <div className="relative group">
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-black/40 text-[10px] font-semibold text-white/70 transition-colors group-hover:text-white"
                >
                  i
                </button>

                {/* Tooltip */}
                <div
                  className="
                    absolute left-1/2 top-full z-[70] mt-3 w-80 -translate-x-1/2
                    rounded-2xl border border-slate-700/80
                    bg-slate-950
                    px-4 py-3
                    text-xs text-slate-100
                    shadow-[0_18px_40px_rgba(15,23,42,0.95)]
                    backdrop-blur-xl
                    opacity-0 translate-y-0
                    group-hover:opacity-100 group-hover:translate-y-1
                    transition-all duration-200
                  "
                >
                  {/* Arrow pointer */}
                  <div
                    className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-slate-950 border-l border-t border-slate-700/80 shadow-[0_4px_10px_rgba(15,23,42,0.8)]"
                  />

                  <p className="mb-2">
                    This is the current USD value of today&apos;s XPOT,
                    based on the live XPOT price from Jupiter.
                  </p>
                  <p className="text-slate-400">
                    The winner is always paid in{' '}
                    <span className="font-semibold text-emerald-300">
                      XPOT
                    </span>
                    , not USD.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Single-token price */}
          <p className="mt-1 text-xs text-slate-500">
            1 XPOT ≈{' '}
            <span
              className={`
                font-mono transition-colors duration-200
                ${justPumped ? 'text-emerald-300' : 'text-slate-100'}
              `}
            >
              {priceUsd !== null ? priceUsd.toFixed(8) : '0.00000000'}
            </span>{' '}
            <span className="text-slate-500">(via Jupiter)</span>
          </p>
        </div>

        {/* Right: price context stats */}
        <div className="flex flex-col items-end gap-1 text-xs">
          {(maxJackpotToday || reachedMilestone || nextMilestone) && (
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
              XPOT price context
            </p>
          )}

          {maxJackpotToday && (
            <p className="text-[11px] text-slate-400">
              Today&apos;s peak value{' '}
              <span className="font-mono text-slate-100">
                {formatUsd(maxJackpotToday)}
              </span>
            </p>
          )}

          {reachedMilestone && (
            <p className="text-[11px] text-emerald-300">
              Milestone{' '}
              <span className="font-mono">
                {formatUsd(reachedMilestone)}
              </span>
            </p>
          )}

          {nextMilestone && (
            <p className="text-[11px] text-slate-500">
              Next milestone{' '}
              <span className="font-mono">
                {formatUsd(nextMilestone)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Footer explainer */}
      <p className="relative z-10 mt-4 text-xs text-slate-500">
        Today&apos;s XPOT round is fixed at {poolLabel}. Its USD value
        tracks the live on-chain XPOT price from Jupiter and updates
        automatically.
      </p>
    </section>
  );
}
