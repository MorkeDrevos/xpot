// components/JackpotPanel.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TOKEN_MINT, XPOT_POOL_SIZE } from '@/lib/xpot';

const JACKPOT_XPOT = XPOT_POOL_SIZE;
const PRICE_POLL_MS = 2000;

type JackpotPanelProps = {
  isLocked?: boolean;
  onJackpotUsdChange?: (value: number | null) => void;
  variant?: 'standalone' | 'embedded';

  // Badge label shown in header (eg "10+ year runway")
  badgeLabel?: string;

  // Optional tooltip copy for the badge
  badgeTooltip?: string;
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
  25, 50, 75, 100,
  150, 200, 300, 400, 500,
  750, 1_000, 1_500, 2_000, 3_000, 4_000, 5_000,
  7_500, 10_000, 15_000, 20_000, 30_000, 40_000, 50_000,
  75_000, 100_000, 150_000, 200_000, 300_000, 400_000, 500_000,
  750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000,
];

function getMadridSessionKey() {
  // Reliable "YYYYMMDD" for Europe/Madrid without manual hour hacks
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = fmt.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value ?? '0000';
  const month = parts.find(p => p.type === 'month')?.value ?? '00';
  const day = parts.find(p => p.type === 'day')?.value ?? '00';

  return `${year}${month}${day}`;
}

function BadgeWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="relative group">
      <span
        className="
          inline-flex items-center gap-2 rounded-full
          border border-emerald-400/35 bg-emerald-500/10
          px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]
          text-emerald-200
        "
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/90 shadow-[0_0_10px_rgba(52,211,153,0.65)]" />
        {label}
        <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-white/70">
          i
        </span>
      </span>

      <div
        className="
          pointer-events-none absolute right-0 top-full z-[80] mt-3 w-[360px] max-w-[80vw]
          rounded-2xl border border-slate-700/80 bg-slate-950
          px-4 py-3 text-xs text-slate-100
          shadow-[0_18px_40px_rgba(15,23,42,0.95)] backdrop-blur-xl
          opacity-0 translate-y-0
          group-hover:opacity-100 group-hover:translate-y-1
          transition-all duration-200
        "
      >
        <div className="absolute -top-2 right-5 h-4 w-4 rotate-45 bg-slate-950 border-l border-t border-slate-700/80 shadow-[0_4px_10px_rgba(15,23,42,0.8)]" />
        <p className="whitespace-pre-line text-slate-100/90">{tooltip}</p>
        <p className="mt-2 text-slate-400">
          This is tokenomics context only. The daily pool shown here is the current draw amount.
        </p>
      </div>
    </div>
  );
}

function readJupiterUsdPrice(payload: unknown, mint: string): number | null {
  // Supports multiple shapes to avoid brittle breakage
  // - lite-api.jup.ag/price/v3 tends to be either:
  //   { [mint]: { usdPrice: number } }
  //   or { data: { [mint]: { price: number } } }
  if (!payload || typeof payload !== 'object') return null;

  const anyPayload = payload as any;

  const direct = anyPayload[mint]?.usdPrice;
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct;

  const nested1 = anyPayload?.data?.[mint]?.price;
  if (typeof nested1 === 'number' && Number.isFinite(nested1)) return nested1;

  const nested2 = anyPayload?.data?.[mint]?.usdPrice;
  if (typeof nested2 === 'number' && Number.isFinite(nested2)) return nested2;

  return null;
}

export default function JackpotPanel({
  isLocked,
  onJackpotUsdChange,
  variant = 'standalone',
  badgeLabel,
  badgeTooltip,
}: JackpotPanelProps) {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);

  const [maxJackpotToday, setMaxJackpotToday] = useState<number | null>(null);

  const [justPumped, setJustPumped] = useState(false);
  const prevJackpot = useRef<number | null>(null);
  const pumpTimeout = useRef<number | null>(null);

  const [justUpdated, setJustUpdated] = useState(false);
  const updatePulseTimeout = useRef<number | null>(null);

  const sessionKey = useMemo(() => `xpot_max_session_usd_${getMadridSessionKey()}`, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(sessionKey);
    if (stored) {
      const num = Number(stored);
      if (!Number.isNaN(num)) setMaxJackpotToday(num);
      else setMaxJackpotToday(null);
    } else {
      setMaxJackpotToday(null);
    }
  }, [sessionKey]);

  useEffect(() => {
    let timer: number | null = null;
    let aborted = false;
    const ctrl = new AbortController();

    async function fetchPrice() {
      try {
        setHadError(false);

        const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${TOKEN_MINT}`, {
          signal: ctrl.signal,
          cache: 'no-store',
        });

        if (!res.ok) throw new Error('Jupiter price fetch failed');

        const json = await res.json();
        const price = readJupiterUsdPrice(json, TOKEN_MINT);

        if (typeof price === 'number' && Number.isFinite(price)) {
          if (aborted) return;

          setPriceUsd(price);

          setJustUpdated(true);
          if (updatePulseTimeout.current !== null) window.clearTimeout(updatePulseTimeout.current);
          updatePulseTimeout.current = window.setTimeout(() => setJustUpdated(false), 400);
        } else {
          if (aborted) return;
          setPriceUsd(null);
          setHadError(true);
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        console.error('[XPOT] Jupiter price error:', err);
        if (aborted) return;
        setPriceUsd(null);
        setHadError(true);
      } finally {
        if (!aborted) setIsLoading(false);
      }
    }

    // Pause polling when tab is hidden (saves calls + feels cleaner)
    function onVis() {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') fetchPrice();
    }

    fetchPrice();
    timer = window.setInterval(fetchPrice, PRICE_POLL_MS);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }

    return () => {
      aborted = true;
      ctrl.abort();

      if (timer !== null) window.clearInterval(timer);
      if (updatePulseTimeout.current !== null) window.clearTimeout(updatePulseTimeout.current);
      if (pumpTimeout.current !== null) window.clearTimeout(pumpTimeout.current);

      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, []);

  const jackpotUsd = priceUsd !== null ? JACKPOT_XPOT * priceUsd : null;

  useEffect(() => {
    if (typeof onJackpotUsdChange === 'function') onJackpotUsdChange(jackpotUsd);
    if (jackpotUsd == null) return;

    if (prevJackpot.current !== null && jackpotUsd > prevJackpot.current) {
      setJustPumped(true);
      if (pumpTimeout.current !== null) window.clearTimeout(pumpTimeout.current);
      pumpTimeout.current = window.setTimeout(() => setJustPumped(false), 1600);
    }
    prevJackpot.current = jackpotUsd;

    if (typeof window !== 'undefined') {
      setMaxJackpotToday(prev => {
        const next = prev == null ? jackpotUsd : Math.max(prev, jackpotUsd);
        window.localStorage.setItem(sessionKey, String(next));
        return next;
      });
    }
  }, [jackpotUsd, sessionKey, onJackpotUsdChange]);

  const reachedMilestone =
    jackpotUsd != null ? MILESTONES.filter(m => jackpotUsd >= m).slice(-1)[0] ?? null : null;

  const nextMilestone =
    jackpotUsd != null ? MILESTONES.find(m => jackpotUsd < m) ?? null : null;

  const showUnavailable = !isLoading && (jackpotUsd === null || hadError || priceUsd === null);

  const poolLabel = `${JACKPOT_XPOT.toLocaleString()} XPOT`;
  const displayUsd = jackpotUsd === null ? '—' : formatUsd(jackpotUsd);

  const runwayTooltip =
    badgeTooltip ||
    `Funded at launch: 3.75B XPOT is allocated to the Rewards Runway wallet.\nAt 1,000,000 XPOT/day, that covers ~10.3 years of baseline rewards.\nDistribution remains on-chain and transparent.`;

  const panelChrome =
    variant === 'embedded'
      ? 'rounded-2xl border border-slate-800/70 bg-slate-950/55 px-5 py-4 shadow-sm'
      : 'rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 shadow-sm';

  return (
    <section className={`relative transition-colors duration-300 ${panelChrome}`}>
      <div
        className={`
          pointer-events-none absolute inset-0 rounded-2xl
          border border-[#3BA7FF]/40
          shadow-[0_0_40px_rgba(59,167,255,0.45)]
          opacity-0 transition-opacity duration-500
          ${justPumped ? 'opacity-100' : ''}
        `}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex rounded-full bg-[rgba(59,167,255,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7CC8FF]">
            Today&apos;s XPOT
          </span>

          <span className="inline-flex items-baseline rounded-xl bg-black/40 px-4 py-2 font-mono text-lg tracking-[0.16em] text-slate-100 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
            {poolLabel}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 text-xs">
          {!!badgeLabel && <BadgeWithTooltip label={badgeLabel} tooltip={runwayTooltip} />}

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

      <div className="relative z-10 mt-6 flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div
              className={`
                text-5xl sm:text-6xl font-semibold tabular-nums
                transition-transform transition-colors duration-200
                ${justUpdated ? 'scale-[1.01]' : ''}
                ${justPumped ? 'text-[#7CC8FF]' : 'text-white'}
              `}
            >
              {displayUsd}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/25 bg-black/40 px-2.5 py-[5px] text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75">
                USD estimate
              </span>

              <div className="relative group">
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-black/40 text-[10px] font-semibold text-white/70 transition-colors group-hover:text-white"
                  aria-label="USD estimate info"
                >
                  i
                </button>

                <div
                  className="
                    absolute left-1/2 top-full z-[70] mt-3 w-80 -translate-x-1/2
                    rounded-2xl border border-slate-700/80 bg-slate-950
                    px-4 py-3 text-xs text-slate-100
                    shadow-[0_18px_40px_rgba(15,23,42,0.95)] backdrop-blur-xl
                    opacity-0 translate-y-0
                    group-hover:opacity-100 group-hover:translate-y-1
                    transition-all duration-200
                  "
                >
                  <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-slate-950 border-l border-t border-slate-700/80 shadow-[0_4px_10px_rgba(15,23,42,0.8)]" />
                  <p className="mb-2">
                    This is the current USD value of today&apos;s XPOT, based on the live XPOT price from Jupiter.
                  </p>
                  <p className="text-slate-400">
                    The winner is always paid in <span className="font-semibold text-[#7CC8FF]">XPOT</span>, not USD.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            1 XPOT ≈{' '}
            <span className={`font-mono transition-colors duration-200 ${justPumped ? 'text-[#7CC8FF]' : 'text-slate-100'}`}>
              {priceUsd !== null ? priceUsd.toFixed(8) : '0.00000000'}
            </span>{' '}
            <span className="text-slate-500">(via Jupiter)</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-xs">
          {(maxJackpotToday || reachedMilestone || nextMilestone) && (
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
              XPOT price context
            </p>
          )}

          {maxJackpotToday && (
            <p className="text-[11px] text-slate-400">
              Today&apos;s peak value <span className="font-mono text-slate-100">{formatUsd(maxJackpotToday)}</span>
            </p>
          )}

          {reachedMilestone && (
            <p className="text-[11px] text-[#7CC8FF]">
              Milestone <span className="font-mono">{formatUsd(reachedMilestone)}</span>
            </p>
          )}

          {nextMilestone && (
            <p className="text-[11px] text-slate-500">
              Next milestone <span className="font-mono">{formatUsd(nextMilestone)}</span>
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400 leading-relaxed">
        Today&apos;s XPOT round is fixed at 1,000,000 XPOT. Its USD value tracks the live on-chain XPOT price from Jupiter and updates automatically.
      </p>
    </section>
  );
}
