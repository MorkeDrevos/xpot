'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Crown, Info, Sparkles, TrendingUp } from 'lucide-react';

import XpotLogo from '@/components/XpotLogo';
import { TOKEN_MINT } from '@/lib/xpot';

import type { JackpotPanelProps } from './types';
import {
  JACKPOT_XPOT,
  PRICE_POLL_MS,
  SPARK_WINDOW_MS,
  clamp,
  formatCoverage,
  formatUsd,
} from './utils';

import { useDexScreenerPrice } from './useDexScreenerPrice';
import { usePriceSamples } from './usePriceSamples';
import { useMadridCountdown } from './useMadridCountdown';
import { RunwayBadge, UsdEstimateBadge } from './badges';
import { PriceUnavailableNote } from './PriceUnavailableNote';

/* ─────────────────────────────────────────────
   Smooth USD animation helper
───────────────────────────────────────────── */
function useSmoothNumber(target: number | null, opts?: { durationMs?: number }) {
  const durationMs = opts?.durationMs ?? 650;
  const [value, setValue] = useState<number | null>(null);
  const valueRef = useRef<number | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (target == null || !Number.isFinite(target)) {
      setValue(null);
      valueRef.current = null;
      return;
    }

    const from = valueRef.current;
    if (from == null || !Number.isFinite(from)) {
      setValue(target);
      valueRef.current = target;
      return;
    }

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = clamp((now - start) / durationMs, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;

      setValue(next);
      valueRef.current = next;

      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function JackpotPanel({
  isLocked,
  onJackpotUsdChange,
  variant = 'standalone',
  badgeLabel,
  badgeTooltip,
  layout = 'auto',
}: JackpotPanelProps) {
  const { priceUsd, momentumGlobalH1, isLoading, hadError, justUpdated } =
    useDexScreenerPrice(TOKEN_MINT, PRICE_POLL_MS);

  const { mounted, countdownMs, countPulse } = useMadridCountdown();

  const { range24h, coverageMs, spark, sparkCoverageMs } =
    usePriceSamples(priceUsd);

  const jackpotUsd = priceUsd != null ? JACKPOT_XPOT * priceUsd : null;
  const smoothJackpotUsd = useSmoothNumber(jackpotUsd);

  useEffect(() => {
    onJackpotUsdChange?.(jackpotUsd ?? null);
  }, [jackpotUsd, onJackpotUsdChange]);

  const displayUsdText =
    smoothJackpotUsd == null ? '-' : formatUsd(smoothJackpotUsd);

  const observedLabel =
    coverageMs >= 86_400_000
      ? 'Observed: 24h'
      : `Observed: ${formatCoverage(coverageMs)}`;

  const localSparkLabel =
    sparkCoverageMs >= SPARK_WINDOW_MS
      ? 'Local ticks: 1h'
      : `Local ticks: ${formatCoverage(sparkCoverageMs)}`;

  const globalMomentumText =
    momentumGlobalH1 == null ? '-' : `${momentumGlobalH1.toFixed(2)}%`;

  const showUnavailable =
    !isLoading && (priceUsd == null || jackpotUsd == null || hadError);

  const panelChrome =
    variant === 'embedded'
      ? 'w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-5 py-5'
      : 'w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-5 sm:px-6 sm:py-6';

  return (
    <section className={panelChrome}>
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">XPOT live console</p>
          <p className="text-xs text-slate-400">
            Real-time pool value and price telemetry
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-sky-100">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
          Live
        </span>
      </div>

      {/* MAIN */}
      <div className="mt-6 rounded-2xl border border-slate-800/70 bg-black/25 p-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-slate-400">
            Today’s XPOT
          </p>

          <div className="mt-2 text-4xl font-mono text-white">
            {JACKPOT_XPOT.toLocaleString()} XPOT
          </div>

          <div className="mt-4 text-4xl font-semibold text-[#7CC8FF]">
            {displayUsdText}
          </div>
        </div>

        {/* Countdown */}
        <div className="mt-4 flex justify-center gap-3 text-xs text-slate-400">
          <span>Next draw in</span>
          <span className="font-mono">
            {mounted
              ? new Date(countdownMs).toISOString().substr(11, 8)
              : '00:00:00'}
          </span>
          <span>22:00 Madrid</span>
        </div>

        {showUnavailable && (
          <div className="mt-3">
            <PriceUnavailableNote />
          </div>
        )}

        {/* Telemetry */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-slate-500">Pulse (1h)</p>
            <p className="text-sm text-white">{globalMomentumText}</p>
          </div>

          <div>
            <p className="text-xs uppercase text-slate-500">24h Range</p>
            {range24h ? (
              <p className="text-sm text-white">
                {formatUsd(range24h.lowUsd)} – {formatUsd(range24h.highUsd)}
              </p>
            ) : (
              <p className="text-sm text-slate-400">–</p>
            )}
          </div>

          <div>
            <p className="text-xs uppercase text-slate-500">Observed</p>
            <p className="text-sm text-slate-300">{observedLabel}</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 flex justify-end">
        <Link
          href="/hub"
          className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-5 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
        >
          Enter today’s XPOT →
        </Link>
      </div>
    </section>
  );
}
