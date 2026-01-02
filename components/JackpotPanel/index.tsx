'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Crown, Info, Sparkles, TrendingUp } from 'lucide-react';

import { TOKEN_MINT, XPOT_POOL_SIZE } from '@/lib/xpot';
import XpotLogo from '@/components/XpotLogo';

import type { JackpotPanelProps, PriceSource } from './types';
import { formatCountdown, formatCoverage, formatUsd, clamp, easeOutCubic, getMadridSessionKey } from './utils';
import { useDexScreenerPrice } from './useDexScreenerPrice';
import { useMadridCountdown } from './useMadridCountdown';
import { usePriceSamples } from './usePriceSamples';
import { useAutoWide } from './useAutoWide';
import { RunwayBadge, UsdEstimateBadge } from './badges';
import { PriceUnavailableNote } from './PriceUnavailableNote';

const JACKPOT_XPOT = XPOT_POOL_SIZE;

// DexScreener can rate-limit too - keep this calmer than 2s
const PRICE_POLL_MS = 4000; // 4s

// 24h observed range via rolling samples
const RANGE_SAMPLE_MS = 10_000; // store one sample every 10s
const RANGE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const RANGE_STORAGE_KEY = 'xpot_price_samples_24h_v1';
const RANGE_MAX_SAMPLES = Math.ceil(RANGE_WINDOW_MS / RANGE_SAMPLE_MS) + 120;

// Sparkline window (local ticks)
const SPARK_WINDOW_MS = 60 * 60 * 1000; // 1h
const SPARK_MAX_POINTS = 80;

// Milestone ladder for highlights (USD) - start at $5
const MILESTONES = [
  5, 10, 15, 20, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1_000, 1_500, 2_000,
  3_000, 4_000, 5_000, 7_500, 10_000, 15_000, 20_000, 30_000, 40_000, 50_000, 75_000,
  100_000, 150_000, 200_000, 300_000, 400_000, 500_000, 750_000, 1_000_000, 1_500_000,
  2_000_000, 3_000_000, 5_000_000, 10_000_000,
];

export default function JackpotPanel({
  isLocked,
  onJackpotUsdChange,
  variant = 'standalone',
  badgeLabel,
  badgeTooltip,
  layout = 'auto',
}: JackpotPanelProps) {
  const priceSource: PriceSource = 'DexScreener';

  const { priceUsd, momentumGlobalH1, isLoading, hadError, justUpdated } = useDexScreenerPrice(
    TOKEN_MINT,
    PRICE_POLL_MS,
  );

  const { mounted, countdownMs, countPulse } = useMadridCountdown(22);

  const { slabRef } = useAutoWide(layout);

  const { range24h, coverageMs, spark, sparkCoverageMs } = usePriceSamples({
    priceUsd,
    jackpotXpot: JACKPOT_XPOT,
    rangeSampleMs: RANGE_SAMPLE_MS,
    rangeWindowMs: RANGE_WINDOW_MS,
    rangeStorageKey: RANGE_STORAGE_KEY,
    rangeMaxSamples: RANGE_MAX_SAMPLES,
    sparkWindowMs: SPARK_WINDOW_MS,
    sparkMaxPoints: SPARK_MAX_POINTS,
  });

  const jackpotUsd = priceUsd !== null ? JACKPOT_XPOT * priceUsd : null;

  const [maxJackpotToday, setMaxJackpotToday] = useState<number | null>(null);

  // Soft drift animation for the big USD number
  const [displayJackpotUsd, setDisplayJackpotUsd] = useState<number | null>(null);
  const displayRef = useRef<number | null>(null);

  // Pump glow
  const [justPumped, setJustPumped] = useState(false);
  const pumpTimeout = useRef<number | null>(null);
  const prevJackpot = useRef<number | null>(null);

  // runway fade-in
  const [showRunway, setShowRunway] = useState(false);

  // session key hydration-safe
  const [sessionKey, setSessionKey] = useState('xpot_max_session_usd_boot');
  useEffect(() => {
    setSessionKey(`xpot_max_session_usd_${getMadridSessionKey(22)}`);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mounted) return;
    if (sessionKey.endsWith('_boot')) return;

    const stored = window.localStorage.getItem(sessionKey);
    if (stored) {
      const num = Number(stored);
      if (!Number.isNaN(num)) setMaxJackpotToday(num);
      else setMaxJackpotToday(null);
    } else {
      setMaxJackpotToday(null);
    }
  }, [sessionKey, mounted]);

  useEffect(() => {
    if (showRunway) return;
    if (isLoading) return;
    if (priceUsd == null) return;
    if (displayJackpotUsd == null) return;

    const t = window.setTimeout(() => setShowRunway(true), 320);
    return () => window.clearTimeout(t);
  }, [isLoading, priceUsd, displayJackpotUsd, showRunway]);

  useEffect(() => {
    if (typeof onJackpotUsdChange === 'function') onJackpotUsdChange(jackpotUsd);
    if (jackpotUsd == null) return;

    if (prevJackpot.current !== null && jackpotUsd > prevJackpot.current) {
      setJustPumped(true);
      if (pumpTimeout.current !== null) window.clearTimeout(pumpTimeout.current);
      pumpTimeout.current = window.setTimeout(() => setJustPumped(false), 1200);
    }
    prevJackpot.current = jackpotUsd;

    if (typeof window !== 'undefined') {
      if (!mounted) return;
      if (sessionKey.endsWith('_boot')) return;

      setMaxJackpotToday(prev => {
        const next = prev == null ? jackpotUsd : Math.max(prev, jackpotUsd);
        window.localStorage.setItem(sessionKey, String(next));
        return next;
      });
    }
  }, [jackpotUsd, sessionKey, onJackpotUsdChange, mounted]);

  // Soft USD drift animation
  useEffect(() => {
    displayRef.current = displayJackpotUsd;
  }, [displayJackpotUsd]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (jackpotUsd == null) {
      setDisplayJackpotUsd(null);
      displayRef.current = null;
      return;
    }

    const from = displayRef.current;

    if (from == null || !Number.isFinite(from)) {
      setDisplayJackpotUsd(jackpotUsd);
      displayRef.current = jackpotUsd;
      return;
    }

    const to = jackpotUsd;
    const delta = Math.abs(to - from);

    if (!Number.isFinite(delta) || delta < 0.01) {
      setDisplayJackpotUsd(to);
      displayRef.current = to;
      return;
    }

    const DURATION_MS = 650;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = clamp((now - start) / DURATION_MS, 0, 1);
      const eased = easeOutCubic(t);
      const next = from + (to - from) * eased;

      setDisplayJackpotUsd(next);
      displayRef.current = next;

      if (t < 1) raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [jackpotUsd]);

  const nextMilestone = jackpotUsd != null ? MILESTONES.find(m => jackpotUsd < m) ?? null : null;

  const prevMilestoneForBar = useMemo(() => {
    if (jackpotUsd == null) return null;
    const prev = MILESTONES.filter(m => jackpotUsd >= m).slice(-1)[0];
    return prev ?? 0;
  }, [jackpotUsd]);

  const progressToNext = useMemo(() => {
    if (jackpotUsd == null) return null;
    const prev = prevMilestoneForBar ?? 0;
    const next = nextMilestone ?? null;
    if (next == null) return 1;
    if (next === prev) return 1;
    return clamp((jackpotUsd - prev) / (next - prev), 0, 1);
  }, [jackpotUsd, nextMilestone, prevMilestoneForBar]);

  const showUnavailable = !isLoading && (jackpotUsd === null || hadError || priceUsd === null);

  const displayUsdText =
    displayJackpotUsd === null || !Number.isFinite(displayJackpotUsd) ? '-' : formatUsd(displayJackpotUsd);

  const observedLabel = coverageMs >= RANGE_WINDOW_MS ? 'Observed: 24h' : `Observed: ${formatCoverage(coverageMs)}`;
  const localSparkLabel =
    sparkCoverageMs >= SPARK_WINDOW_MS ? 'Local ticks: 1h' : `Local ticks: ${formatCoverage(sparkCoverageMs)}`;

  const globalMomentumText =
    momentumGlobalH1 == null || !Number.isFinite(momentumGlobalH1) ? '-' : `${momentumGlobalH1.toFixed(2)}%`;

  const leftMilestoneLabel =
    (nextMilestone === 5 && (prevMilestoneForBar ?? 0) === 0) || (prevMilestoneForBar ?? 0) === 0
      ? 'Under $5'
      : formatUsd(prevMilestoneForBar ?? 0);

  const rightMilestoneLabel = nextMilestone ? formatUsd(nextMilestone) : '-';

  const panelChrome =
    variant === 'embedded'
      ? 'w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-5 py-5 shadow-sm'
      : 'w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-5 sm:px-6 sm:py-6';

  return (
    <section className={`relative transition-colors duration-300 ${panelChrome}`}>
      <div>
        {!!badgeLabel && (
          <div
            className={[
              'relative z-10 mb-4 flex justify-center transition-all duration-[900ms] ease-out',
              showRunway ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
            ].join(' ')}
          >
            <RunwayBadge label={badgeLabel} tooltip={badgeTooltip} />
          </div>
        )}

        {/* HEADER */}
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-100">XPOT live console</p>
            <p className="mt-1 text-xs text-slate-400">Real-time pool value and price telemetry.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.55)]" />
              Live
            </span>
          </div>
        </div>

        {/* MAIN SLAB */}
        <div
          ref={slabRef}
          className="relative z-10 mt-5 overflow-hidden border-y border-slate-800/80 bg-black/25 px-4 py-4 sm:rounded-2xl sm:border sm:p-5"
        >
          {/* Visible engine + alive background */}
          <div className="pointer-events-none absolute inset-0">
            <div className="xpot-engine absolute inset-0" />
            <div className="xpot-aurora absolute inset-0 opacity-70" />
            <div className="xpot-noise absolute inset-0 opacity-[0.10]" />
            <div className="xpot-scan absolute inset-0 opacity-[0.12]" />
          </div>

          {/* Marketing row */}
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="group relative inline-flex max-w-full items-center">
                <div className="relative inline-grid max-w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-black/55 px-4 py-3 shadow-[0_0_0_1px_rgba(15,23,42,0.85),0_28px_80px_rgba(0,0,0,0.52)] backdrop-blur-xl">
                  <div className="pointer-events-none absolute inset-0 rounded-2xl xpot-capsule-border" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-70 xpot-capsule-glow" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-65 xpot-sheen" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-60 xpot-capsule-shimmer" />

                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 xpot-dot" />
                    Today&apos;s XPOT
                  </span>

                  <div className="min-w-0 px-1 text-center">
                    <span
                      className="xpot-pool-hero inline-flex items-baseline justify-center gap-2 font-mono tabular-nums text-white"
                      style={{ textShadow: '0 0 22px rgba(124,200,255,0.10)' }}
                    >
                      <span className="xpot-pool-num">{JACKPOT_XPOT.toLocaleString()}</span>
                      <span className="xpot-pool-unit">XPOT</span>
                    </span>
                  </div>

                  <span className="inline-flex items-center rounded-full border border-slate-700/60 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                    Daily
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLocked && (
                <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200">
                  Draw locked
                </span>
              )}
            </div>
          </div>

          <div className="relative mt-5 grid gap-4">
            <div
              className={[
                'relative overflow-visible rounded-2xl border bg-black/30 px-4 sm:px-5 py-4',
                justUpdated ? 'border-sky-400/35' : 'border-slate-800/70',
                justPumped ? 'shadow-[0_0_34px_rgba(56,189,248,0.16)]' : 'shadow-none',
              ].join(' ')}
              style={{
                background:
                  'radial-gradient(circle_at_20%_25%, rgba(56,189,248,0.08), transparent 55%), radial-gradient(circle_at_80%_20%, rgba(236,72,153,0.05), transparent 60%), linear-gradient(180deg, rgba(2,6,23,0.30), rgba(0,0,0,0.05))',
              }}
            >
              <div
                className={[
                  'pointer-events-none absolute -inset-6 opacity-0 transition-opacity duration-300',
                  justUpdated ? 'opacity-100' : '',
                ].join(' ')}
              >
                <div className="xpot-pulse-halo absolute inset-0" />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-end sm:gap-3">
                  <div
                    className={[
                      'xpot-usd-live text-4xl sm:text-[4.25rem] font-semibold tabular-nums transition-transform transition-colors duration-200',
                      justUpdated ? 'scale-[1.01]' : '',
                      justPumped ? 'text-[#7CC8FF]' : 'text-white',
                    ].join(' ')}
                    style={{ textShadow: '0 0 26px rgba(124,200,255,0.12)' }}
                  >
                    {displayUsdText}
                  </div>

                  <div className="flex items-center gap-2 sm:mb-2">
                    <UsdEstimateBadge compact />
                    <span className="hidden sm:inline text-[11px] uppercase tracking-[0.22em] text-slate-500">
                      USD estimate
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 sm:mb-2 sm:justify-end">
                  <span
                    className={[
                      'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300 transition-shadow',
                      justUpdated ? 'shadow-[0_0_0_1px_rgba(124,200,255,0.14),0_0_16px_rgba(59,167,255,0.08)]' : '',
                    ].join(' ')}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 xpot-dot" />
                    Live tick
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span
                  className={[
                    'inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300 transition-shadow',
                    countPulse ? 'shadow-[0_0_0_1px_rgba(124,200,255,0.14),0_0_16px_rgba(59,167,255,0.08)]' : '',
                  ].join(' ')}
                >
                  Next draw in
                </span>

                <span
                  className={[
                    'font-mono text-sm tracking-[0.26em] transition-colors',
                    countPulse ? 'text-white' : 'text-slate-100',
                  ].join(' ')}
                  style={{ textShadow: '0 0 18px rgba(124,200,255,0.10)' }}
                >
                  {mounted ? formatCountdown(countdownMs) : '00:00:00'}
                </span>

                <span className="text-[11px] text-slate-600">22:00 Madrid</span>
              </div>

              {showUnavailable ? (
                <div className="mt-3">
                  <PriceUnavailableNote />
                </div>
              ) : (
                <p className="mt-2 text-center text-xs text-slate-500 sm:text-left">
                  Auto-updates from DexScreener ticks
                </p>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div
                  className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-black/20 px-4 py-3"
                  style={{
                    background:
                      'radial-gradient(circle_at_18%_18%, rgba(124,200,255,0.08), transparent 58%), radial-gradient(circle_at_80%_20%, rgba(236,72,153,0.05), transparent 62%), linear-gradient(180deg, rgba(2,6,23,0.35), rgba(15,23,42,0.00))',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/30 border border-slate-700/60 shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_10px_22px_rgba(0,0,0,0.35)]">
                        <XpotLogo variant="mark" width={28} height={28} tone="gold" priority />
                      </span>

                      <div className="leading-tight">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-200">XPOT token</p>
                        <p className="text-xs text-slate-300">Winners paid in XPOT</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                      <Sparkles className="h-3.5 w-3.5 opacity-90" />
                      Verified
                    </span>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-500">Paid in XPOT. USD is an estimate only.</p>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-black/20 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">USD value</p>

                  <p className="mt-1 text-sm text-slate-300">
                    1 XPOT ≈{' '}
                    <span className="font-mono text-slate-100">
                      {priceUsd !== null ? priceUsd.toFixed(8) : '0.00000000'}
                    </span>
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                    <span>{observedLabel}</span>
                    <span className="text-slate-700">•</span>
                    <span>
                      Source <span className="font-mono text-slate-200">{priceSource}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-black/20 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Pulse (global 1h)</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-slate-100">{globalMomentumText}</span>
                    <span className="text-[11px] text-slate-500">DexScreener</span>
                  </div>
                </div>
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 bg-black/25">
                  <TrendingUp className="h-4 w-4 text-slate-200/80" />
                </span>
              </div>

              {spark ? (
                <div className="mt-2">
                  <svg width="100%" height="34" viewBox="0 0 560 54" className="block text-slate-300/70">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.0"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={spark.points}
                      opacity="0.85"
                    />
                  </svg>
                  <p className="mt-1 text-[11px] text-slate-600">{localSparkLabel}</p>
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-slate-600">Collecting ticks…</p>
              )}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-black/20 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">24h range (observed)</p>
                  {range24h ? (
                    <p className="mt-1 text-sm text-slate-100">
                      <span className="font-mono">{formatUsd(range24h.lowUsd)}</span>{' '}
                      <span className="text-slate-600">-</span>{' '}
                      <span className="font-mono">{formatUsd(range24h.highUsd)}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-100">-</p>
                  )}
                  <p className="mt-2 text-[11px] text-slate-600">{observedLabel}</p>
                </div>

                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 bg-black/25">
                  <Info className="h-4 w-4 text-slate-200/70" />
                </span>
              </div>

              {maxJackpotToday != null ? (
                <p className="mt-2 text-[11px] text-slate-600">
                  Session peak <span className="font-mono text-slate-200">{formatUsd(maxJackpotToday)}</span>
                </p>
              ) : null}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-black/20 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Next milestone</p>
                  <p className="mt-1 text-sm text-slate-100">
                    {nextMilestone ? (
                      <>
                        <span className="font-mono">{rightMilestoneLabel}</span>{' '}
                        <span className="text-[11px] text-slate-500">
                          ({jackpotUsd != null && progressToNext != null ? `${Math.round(progressToNext * 100)}%` : '-'})
                        </span>
                      </>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>

                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/60 bg-black/25">
                  <Crown className="h-4 w-4 opacity-90 text-slate-200/80" />
                </span>
              </div>

              <div className="mt-3">
                <div className="relative h-2 overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full shadow-[0_0_18px_rgba(59,167,255,0.12)]"
                    style={{
                      width: `${Math.round((progressToNext ?? 0) * 100)}%`,
                      background: 'linear-gradient(90deg, rgba(236,72,153,0.28), rgba(124,200,255,0.60))',
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-200">{leftMilestoneLabel}</span>
                  <span className="font-mono text-slate-200">{rightMilestoneLabel}</span>
                </div>

                <p className="mt-2 text-[11px] text-slate-600">
                  Today&apos;s pool is fixed at {JACKPOT_XPOT.toLocaleString()} XPOT. Paid in XPOT.
                </p>
              </div>
            </div>
          </div>

          {/* KEEP your real big <style jsx> block here exactly as-is */}
          <style jsx>{`
            /* paste your existing big style block here unchanged */
          `}</style>
        </div>

        <div className="relative z-10 mt-4 overflow-hidden rounded-2xl border border-slate-800/70 bg-black/15 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-slate-400">
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Context</span>

              {maxJackpotToday != null && (
                <span>
                  Session peak <span className="font-mono text-slate-100">{formatUsd(maxJackpotToday)}</span>
                </span>
              )}

              {range24h && (
                <span>
                  24h <span className="font-mono text-slate-100">{formatUsd(range24h.lowUsd)}</span> -{' '}
                  <span className="font-mono text-slate-100">{formatUsd(range24h.highUsd)}</span>
                </span>
              )}

              <span className="text-slate-500">{observedLabel}</span>

              <span className="text-slate-500">
                Source <span className="font-mono text-slate-200">DexScreener</span>
              </span>
            </div>

            <Link
              href="/hub"
              className="shrink-0 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20 hover:text-emerald-100 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition"
            >
              Enter today&apos;s XPOT →
            </Link>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">Live price - updates every {Math.round(PRICE_POLL_MS / 1000)}s</p>
        </div>
      </div>
    </section>
  );
}
