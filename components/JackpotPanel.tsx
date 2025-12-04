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

/**
 * Helper: "XPOT session key" for Europe/Madrid.
 *
 * We want stats to reset when the daily XPOT round resets at 22:00 Madrid time,
 * not at calendar midnight.
 *
 * So:
 *  - From 22:00 → 23:59:59, we treat this as the *next* session day.
 *  - From 00:00 → 21:59:59, we treat it as the current calendar day.
 *
 * This way, Highest today / Milestone / Next at all belong to a 24h window
 * that rolls at 22:00.
 */
function getMadridSessionKey() {
  const now = new Date();

  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });

  const parts = fmt.formatToParts(now);

  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;

  for (const p of parts) {
    switch (p.type) {
      case 'year':
        year = Number(p.value);
        break;
      case 'month':
        month = Number(p.value);
        break;
      case 'day':
        day = Number(p.value);
        break;
      case 'hour':
        hour = Number(p.value);
        break;
      default:
        break;
    }
  }

  // Base date in Madrid (UTC container)
  const baseDate = new Date(Date.UTC(year, month - 1, day));

  // If it's 22:00 or later in Madrid, move to the *next* calendar day for this session
  if (hour >= 22) {
    baseDate.setUTCDate(baseDate.getUTCDate() + 1);
  }

  const y = baseDate.getUTCFullYear();
  const m = String(baseDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(baseDate.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`; // e.g. "20251205"
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

  // Tooltip for USD estimate
  const [showTooltip, setShowTooltip] = useState(false);

  // Per-session localStorage key (session rolls at 22:00 Madrid)
  const sessionKey = getMadridSessionKey();

  // Load max XPOT value for *this* XPOT session from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(
      `xpot_max_jackpot_madrid_${sessionKey}`,
    );
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

  // Track pumps and "highest this XPOT session" + notify parent
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

    // Store highest XPOT USD value of this session
    if (typeof window !== 'undefined') {
      setMaxJackpotToday(prev => {
        const next =
          prev == null ? jackpotUsd : Math.max(prev, jackpotUsd);
        window.localStorage.setItem(
          `xpot_max_jackpot_madrid_${sessionKey}`,
          String(next),
        );
        return next;
      });
    }
  }, [jackpotUsd, sessionKey, onJackpotUsdChange]);

  // Milestones (based on current live XPOT value)
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
  const usdText = formatUsd(jackpotUsd);

  return (
    <section
      className={`
        relative z-10 overflow-hidden
        rounded-2xl border border-slate-800
        bg-slate-950/70 px-5 py-4 shadow-sm
        transition-colors duration-300
      `}
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
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Today&apos;s XPOT
          </p>
          {/* Pool size */}
          <p className="mt-2 text-lg font-semibold tracking-[0.18em] text-slate-100">
            {poolLabel}
          </p>
        </div>

        <div className="flex flex-col.items-end gap-1">
          {isLocked && (
            <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200">
              Draw locked
            </span>
          )}

          {showUnavailable && (
            <span className="text-[11px] font-semibold text-amber-300">
              Live XPOT price not available yet.
            </span>
          )}
        </div>
      </div>

      {/* MAIN NUMBERS */}
      <div className="relative mt-5 flex flex-wrap items-end justify-between gap-4">
        {/* Left: big USD number + rate */}
        <div>
          <div
            className={`
              mt-1 inline-flex items-baseline gap-2
              text-4xl sm:text-5xl lg:text-6xl
              font-semibold tracking-tight text-white
              font-mono tabular-nums
              transition-transform duration-200
              ${justUpdated ? 'scale-[1.01]' : ''}
            `}
          >
            <span>{usdText}</span>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            1 XPOT ≈{' '}
            <span className="font-mono">
              {priceUsd !== null ? priceUsd.toFixed(8) : '0.00000000'}
            </span>{' '}
            <span className="text-slate-500">(via Jupiter)</span>
          </p>
        </div>

        {/* Right: USD estimate pill + tooltip + session stats */}
        <div className="flex flex-col items-end gap-3 text-xs">
          {/* USD estimate + tooltip */}
          <div className="relative z-40">
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                className="
                  rounded-full border border-slate-100/80
                  bg-slate-50/5 px-4 py-1
                  text-[11px] font-semibold uppercase tracking-[0.18em]
                  text-slate-50
                  shadow-[0_0_18px_rgba(148,163,184,0.7)]
                "
              >
                USD estimate
              </button>

              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400/80 bg-slate-900 text-[11px] font-semibold text-slate-100 hover:border-slate-100 hover:text-white"
              >
                i
              </button>
            </div>

            {showTooltip && (
              <div
                className="
                  absolute left-1/2 top-full z-50 mt-3 w-80
                  -translate-x-1/2 rounded-2xl border border-slate-700
                  bg-slate-950/95 px-4 py-3 text-[11px] leading-relaxed
                  text-slate-100 shadow-xl backdrop-blur-sm
                "
              >
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
            )}
          </div>

          {/* Live XPOT stats (session-based) */}
          {(maxJackpotToday || reachedMilestone || nextMilestone) && (
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
              Live XPOT stats
            </p>
          )}

          {maxJackpotToday && (
            <p className="text-[11px] text-slate-400">
              Highest this session{' '}
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
              Next at{' '}
              <span className="font-mono">
                {formatUsd(nextMilestone)}
              </span>
            </p>
          )}
        </div>
      </div>

      <p className="relative mt-4 text-xs text-slate-500">
        Today&apos;s XPOT round is fixed at {poolLabel}. Its USD value
        tracks the live on-chain XPOT price from Jupiter and updates
        automatically.
      </p>
    </section>
  );
}
