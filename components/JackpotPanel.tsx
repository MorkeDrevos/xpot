// components/JackpotPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { TOKEN_MINT, XPOT_POOL_SIZE } from '@/lib/xpot';

const JACKPOT_XPOT = XPOT_POOL_SIZE;
const PRICE_POLL_MS = 2000; // 2s

type JackpotPanelProps = {
  isLocked?: boolean;
  onJackpotUsdChange?: (value: number | null) => void;
  variant?: 'standalone' | 'embedded';

  // Small badge in header (eg "10+ year runway")
  badgeLabel?: string;

  // Optional: override tooltip copy if needed
  badgeTooltip?: string;

  // ✅ NEW: layout support (fixes your build error)
  layout?: 'auto' | 'wide';
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
  25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1_000, 1_500, 2_000, 3_000, 4_000, 5_000, 7_500, 10_000, 15_000,
  20_000, 30_000, 40_000, 50_000, 75_000, 100_000, 150_000, 200_000, 300_000, 400_000, 500_000, 750_000, 1_000_000,
  1_500_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000,
];

// NOTE: kept as-is from your file (even though it’s a bit odd)
// You can later swap to the more correct session key logic we had before.
function getMadridSessionKey() {
  const now = new Date();
  const madridNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  madridNow.setHours(madridNow.getHours() + 2); // roll at 22:00
  const year = madridNow.getFullYear();
  const month = String(madridNow.getMonth() + 1).padStart(2, '0');
  const day = String(madridNow.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function HeaderBadge({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="relative group inline-flex items-center">
      <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
        {label}
      </span>

      <div
        className="
          pointer-events-none absolute right-0 top-full z-[80] mt-2 w-[320px]
          rounded-2xl border border-slate-700/80 bg-slate-950
          px-4 py-3 text-[12px] leading-relaxed text-slate-100
          shadow-[0_18px_40px_rgba(15,23,42,0.95)] backdrop-blur-xl
          opacity-0 translate-y-0
          group-hover:opacity-100 group-hover:translate-y-1
          transition-all duration-200
          whitespace-pre-line
        "
      >
        <div className="absolute -top-2 right-6 h-4 w-4 rotate-45 bg-slate-950 border-l border-t border-slate-700/80 shadow-[0_4px_10px_rgba(15,23,42,0.8)]" />
        {tooltip}
      </div>
    </div>
  );
}

export default function JackpotPanel({
  isLocked,
  onJackpotUsdChange,
  variant = 'standalone',
  badgeLabel,
  badgeTooltip,
  layout = 'auto',
}: JackpotPanelProps) {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);

  const [maxJackpotToday, setMaxJackpotToday] = useState<number | null>(null);

  const [justPumped, setJustPumped] = useState(false);
  const prevJackpot = useRef<number | null>(null);

  const [justUpdated, setJustUpdated] = useState(false);
  const updatePulseTimeout = useRef<number | null>(null);

  const sessionKey = `xpot_max_session_usd_${getMadridSessionKey()}`;

  const isWide = layout === 'wide';

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

  useEffect(() => {
    let timer: number | null = null;

    async function fetchPrice() {
      try {
        setHadError(false);

        const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${TOKEN_MINT}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Jupiter price fetch failed');

        const json = (await res.json()) as Record<string, { usdPrice: number; priceChange24h?: number }>;
        const token = json[TOKEN_MINT];
        const price = token?.usdPrice;

        if (typeof price === 'number' && !Number.isNaN(price)) {
          setPriceUsd(price);

          setJustUpdated(true);
          if (updatePulseTimeout.current !== null) window.clearTimeout(updatePulseTimeout.current);
          updatePulseTimeout.current = window.setTimeout(() => setJustUpdated(false), 400);
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
      if (timer !== null) window.clearInterval(timer);
      if (updatePulseTimeout.current !== null) window.clearTimeout(updatePulseTimeout.current);
    };
  }, []);

  const jackpotUsd = priceUsd !== null ? JACKPOT_XPOT * priceUsd : null;

  useEffect(() => {
    if (typeof onJackpotUsdChange === 'function') onJackpotUsdChange(jackpotUsd);
    if (jackpotUsd == null) return;

    if (prevJackpot.current !== null && jackpotUsd > prevJackpot.current) {
      setJustPumped(true);
      setTimeout(() => setJustPumped(false), 1600);
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

  const reachedMilestone = jackpotUsd != null ? MILESTONES.filter(m => jackpotUsd >= m).slice(-1)[0] ?? null : null;
  const nextMilestone = jackpotUsd != null ? MILESTONES.find(m => jackpotUsd < m) ?? null : null;

  const showUnavailable = !isLoading && (jackpotUsd === null || hadError || priceUsd === null);

  const poolLabel = `${JACKPOT_XPOT.toLocaleString()} XPOT`;
  const displayUsd = jackpotUsd === null ? '—' : formatUsd(jackpotUsd);

  const tooltipDefault =
    "Funded for 10+ years of daily XPOT rewards.\nSized at launch from the Rewards Reserve: 1,000,000 XPOT/day baseline.\nPaid in XPOT, on-chain, auditable.";

  const chrome =
    variant === 'embedded'
      ? 'rounded-2xl border border-slate-800/70 bg-slate-950/55 px-5 py-5 shadow-sm'
      : 'rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 shadow-sm';

  return (
    <section className={`relative transition-colors duration-300 ${chrome}`}>
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
          {!!badgeLabel && <HeaderBadge label={badgeLabel} tooltip={badgeTooltip || tooltipDefault} />}

          {isLocked && (
            <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200">
              Draw locked
            </span>
          )}

          {showUnavailable && <span className="text-[11px] font-semibold text-amber-300">Live price not available yet.</span>}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 mt-6">
        <div className={isWide ? 'grid gap-4 lg:grid-cols-[1fr_340px]' : 'flex flex-wrap items-end justify-between gap-6'}>
          {/* LEFT: Big USD */}
          <div className={isWide ? 'rounded-2xl border border-slate-800/70 bg-black/25 px-5 py-4' : 'space-y-3'}>
            <div className={isWide ? 'space-y-3' : 'space-y-3'}>
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
          </div>

          {/* RIGHT: Context block (only in wide; otherwise your original right column stays below) */}
          {isWide ? (
            <div className="rounded-2xl border border-slate-800/70 bg-black/25 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 text-right">USD value</p>

              <div className="mt-2 text-right">
                <p className="text-sm text-slate-300">
                  1 XPOT ≈ <span className="font-mono text-slate-100">{priceUsd !== null ? priceUsd.toFixed(8) : '0.00000000'}</span>
                </p>

                <p className="mt-2 text-[11px] text-slate-600">
                  Source: <span className="font-mono text-slate-300">Jupiter</span>
                </p>
              </div>

              <div className="mt-4 border-t border-white/10 pt-3 text-right">
                {(maxJackpotToday || reachedMilestone || nextMilestone) && (
                  <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">XPOT price context</p>
                )}

                {maxJackpotToday && (
                  <p className="text-[11px] text-slate-400">
                    Today&apos;s peak value <span className="font-mono text-slate-100">{formatUsd(maxJackpotToday)}</span>
                  </p>
                )}

                {reachedMilestone && (
                  <p className="mt-1 text-[11px] text-[#7CC8FF]">
                    Milestone <span className="font-mono">{formatUsd(reachedMilestone)}</span>
                  </p>
                )}

                {nextMilestone && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Next milestone <span className="font-mono">{formatUsd(nextMilestone)}</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1 text-xs">
              {(maxJackpotToday || reachedMilestone || nextMilestone) && (
                <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">XPOT price context</p>
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
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400 leading-relaxed">
        Today&apos;s XPOT round is fixed at 1,000,000 XPOT. Its USD value tracks the live on-chain XPOT price from Jupiter and updates
        automatically.
      </p>
    </section>
  );
}
