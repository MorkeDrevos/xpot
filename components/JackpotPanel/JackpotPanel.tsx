// components/JackpotPanel/JackpotPanel.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Crown, Info, Sparkles, TrendingUp, ChevronDown } from 'lucide-react';

import XpotLogo from '@/components/XpotLogo';
import { TOKEN_MINT, XPOT_POOL_SIZE } from '@/lib/xpot';

import { useDexScreenerPrice } from './hooks/useDexScreenerPrice';
import { useMadridCountdown } from './hooks/useMadridCountdown';
import { usePriceSamples } from './hooks/usePriceSamples';

import { clamp, formatCoverage, formatUsd } from './utils/madrid';
import { RunwayBadge, UsdEstimateBadge, PriceUnavailableNote } from './ui/badges';

type JackpotPanelVariant = 'standalone' | 'embedded';
type JackpotPanelLayout = 'auto' | 'wide' | 'normal';
type JackpotPanelMode = 'default' | 'hero';

export type JackpotPanelProps = {
  isLocked?: boolean;
  onJackpotUsdChange?: (usd: number | null) => void;
  variant?: JackpotPanelVariant;
  badgeLabel?: string;
  badgeTooltip?: string;
  layout?: JackpotPanelLayout;
  mode?: JackpotPanelMode; // optional "hero" mode used on homepage
};

const JACKPOT_XPOT = XPOT_POOL_SIZE;
const PRICE_POLL_MS = 4000; // 4s

const MILESTONES = [
  5, 10, 15, 20, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1_000, 1_500, 2_000,
  3_000, 4_000, 5_000, 7_500, 10_000, 15_000, 20_000, 30_000, 40_000, 50_000, 75_000,
  100_000, 150_000, 200_000, 300_000, 400_000, 500_000, 750_000, 1_000_000, 1_500_000,
  2_000_000, 3_000_000, 5_000_000, 10_000_000,
] as const;

const RANGE_WINDOW_MS = 24 * 60 * 60 * 1000;
const SPARK_WINDOW_MS = 60 * 60 * 1000;

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

    const to = target;
    const delta = Math.abs(to - from);
    if (!Number.isFinite(delta) || delta < 0.01) {
      setValue(to);
      valueRef.current = to;
      return;
    }

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = clamp((now - start) / durationMs, 0, 1);
      const eased = easeOutCubic(t);
      const next = from + (to - from) * eased;

      setValue(next);
      valueRef.current = next;

      if (t < 1) raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [target, durationMs]);

  return value;
}

export default function JackpotPanel({
  isLocked,
  onJackpotUsdChange,
  variant = 'standalone',
  badgeLabel,
  badgeTooltip,
  layout = 'auto',
  mode = 'default',
}: JackpotPanelProps) {
  const isHero = mode === 'hero';

  const { priceUsd, momentumGlobalH1, isLoading, hadError, justUpdated } = useDexScreenerPrice(
    TOKEN_MINT,
    PRICE_POLL_MS,
  );

  const { mounted, countdownMs, countPulse } = useMadridCountdown(22);

  const {
    range24h,
    coverageMs,
    spark,
    sparkCoverageMs,
    maxJackpotToday,
    registerJackpotUsdForSessionPeak,
  } = usePriceSamples(priceUsd);

  // auto-wide slab
  const slabRef = useRef<HTMLDivElement | null>(null);
  const [autoWide, setAutoWide] = useState(false);
  const autoWideRef = useRef(false);

  useEffect(() => {
    if (layout !== 'auto') return;
    if (typeof window === 'undefined') return;

    const el = slabRef.current;
    if (!el) return;

    const RO = (window as any).ResizeObserver as typeof ResizeObserver | undefined;
    if (!RO) return;

    let raf = 0;
    const WIDE_ON = 900;
    const WIDE_OFF = 840;

    const applyWidth = (w: number) => {
      const curr = autoWideRef.current;
      const next = curr ? w >= WIDE_OFF : w >= WIDE_ON;
      if (next === curr) return;
      autoWideRef.current = next;
      setAutoWide(next);
    };

    const ro = new RO(entries => {
      const w = entries[0]?.contentRect?.width ?? 0;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => applyWidth(w));
    });

    ro.observe(el);
    applyWidth(el.getBoundingClientRect().width);

    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [layout]);

  const jackpotUsd = priceUsd != null ? JACKPOT_XPOT * priceUsd : null;
  const smoothJackpotUsd = useSmoothNumber(jackpotUsd, { durationMs: 650 });

  useEffect(() => {
    if (typeof onJackpotUsdChange === 'function') onJackpotUsdChange(jackpotUsd ?? null);
  }, [jackpotUsd, onJackpotUsdChange]);

  useEffect(() => {
    if (jackpotUsd == null) return;
    registerJackpotUsdForSessionPeak(jackpotUsd);
  }, [jackpotUsd, registerJackpotUsdForSessionPeak]);

  const showUnavailable = !isLoading && (jackpotUsd == null || hadError || priceUsd == null);

  const displayUsdText =
    smoothJackpotUsd == null || !Number.isFinite(smoothJackpotUsd) ? '-' : formatUsd(smoothJackpotUsd);

  const observedLabel = coverageMs >= RANGE_WINDOW_MS ? 'Observed: 24h' : `Observed: ${formatCoverage(coverageMs)}`;
  const localSparkLabel =
    sparkCoverageMs >= SPARK_WINDOW_MS ? 'Local ticks: 1h' : `Local ticks: ${formatCoverage(sparkCoverageMs)}`;

  const globalMomentumText =
    momentumGlobalH1 == null || !Number.isFinite(momentumGlobalH1) ? '-' : `${momentumGlobalH1.toFixed(2)}%`;

  const nextMilestone = jackpotUsd != null ? (MILESTONES.find(m => jackpotUsd < m) ?? null) : null;

  const prevMilestoneForBar = useMemo(() => {
    if (jackpotUsd == null) return 0;
    const prev = MILESTONES.filter(m => jackpotUsd >= m).slice(-1)[0];
    return prev ?? 0;
  }, [jackpotUsd]);

  const progressToNext = useMemo(() => {
    if (jackpotUsd == null) return 0;
    const prev = prevMilestoneForBar ?? 0;
    const next = nextMilestone ?? null;
    if (next == null) return 1;
    if (next === prev) return 1;
    return clamp((jackpotUsd - prev) / (next - prev), 0, 1);
  }, [jackpotUsd, nextMilestone, prevMilestoneForBar]);

  const leftMilestoneLabel =
    (nextMilestone === 5 && (prevMilestoneForBar ?? 0) === 0) || (prevMilestoneForBar ?? 0) === 0
      ? 'Under $5'
      : formatUsd(prevMilestoneForBar ?? 0);

  const rightMilestoneLabel = nextMilestone ? formatUsd(nextMilestone) : '-';

  const panelChrome =
    variant === 'embedded'
      ? 'w-full rounded-2xl bg-slate-950/60 px-5 py-5 ring-1 ring-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.50)]'
      : 'w-full rounded-2xl bg-black/35 px-4 py-5 sm:px-6 sm:py-6 ring-1 ring-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.50)]';

  const capsuleWrap = 'group relative inline-flex max-w-full items-center';

  const capsuleInner = [
    'relative inline-grid max-w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl',
    isHero ? 'bg-black/65 px-5 py-4 sm:px-6 sm:py-4' : 'bg-black/55 px-4 py-3',
    'shadow-[0_0_0_1px_rgba(15,23,42,0.85),0_28px_80px_rgba(0,0,0,0.52)] backdrop-blur-xl',
  ].join(' ');

  const capsuleTag = [
    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]',
    isHero ? 'border-white/12 bg-white/[0.04] text-slate-100' : 'border-white/10 bg-white/[0.03] text-slate-200',
  ].join(' ');

  const capsuleValue = [
    'xpot-pool-hero inline-flex items-baseline justify-center gap-2 font-mono tabular-nums text-white',
    isHero ? 'text-[1.05rem] sm:text-[1.15rem]' : '',
  ].join(' ');

  // BIGGER, better scaling across your actual layout width
  const usdClampStyle: React.CSSProperties = isHero
  ? { fontSize: 'clamp(4.6rem, 7.2vw, 8.4rem)', lineHeight: '0.86' }
  : { fontSize: 'clamp(3.4rem, 5.8vw, 6.4rem)', lineHeight: '0.90' };

  return (
    <section
      className={[
        'relative transition-colors duration-300',
        panelChrome,
        isHero ? '-mt-3 sm:-mt-5' : '',
      ].join(' ')}
    >
      {/* Self-contained “alive” motion, premium not noisy */}
      <style jsx>{`
        @keyframes xpotSweep {
          0% { transform: translateX(-30%) skewX(-12deg); opacity: 0.0; }
          18% { opacity: 0.58; }
          55% { opacity: 0.18; }
          100% { transform: translateX(130%) skewX(-12deg); opacity: 0.0; }
        }

        @keyframes xpotFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0px); }
        }

        @keyframes xpotBreathe {
          0% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 0.44; transform: scale(1.01); }
          100% { opacity: 0.18; transform: scale(1); }
        }

        @keyframes xpotGridDrift {
          0% { transform: translateX(-6%) translateY(0%); opacity: 0.12; }
          50% { transform: translateX(6%) translateY(-2%); opacity: 0.22; }
          100% { transform: translateX(-6%) translateY(0%); opacity: 0.12; }
        }

        .xpot-live-sweep { animation: xpotSweep 3.2s ease-in-out infinite; }
        .xpot-usd-float { animation: xpotFloat 4.6s ease-in-out infinite; will-change: transform; }
        .xpot-ambient-breathe { animation: xpotBreathe 5.4s ease-in-out infinite; }
        .xpot-grid-drift { animation: xpotGridDrift 9.2s ease-in-out infinite; }
      `}</style>

      <div>
        {!!badgeLabel && (
          <div className="relative z-10 mb-4 flex justify-center">
            <RunwayBadge label={badgeLabel} tooltip={badgeTooltip} />
          </div>
        )}

        {!isHero && variant !== 'embedded' && (
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-100">Today&apos;s XPOT</p>
              <p className="mt-1 text-xs text-slate-400">Live value and next draw countdown.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.55)]" />
                Live
              </span>
            </div>
          </div>
        )}

        <div
          ref={slabRef}
          className={[
            'relative z-10 overflow-visible rounded-3xl bg-black/10 ring-1 ring-white/5',
            isHero ? 'mt-3 px-4 py-4 sm:mt-4 sm:p-6' : 'mt-4 px-4 py-4 sm:p-5',
            layout === 'wide' ? 'w-full' : '',
            layout === 'auto' && autoWide ? 'w-full' : '',
          ].join(' ')}
          style={{ boxShadow: '0 40px 140px rgba(0,0,0,0.60)' }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background: `
                radial-gradient(circle at 25% 20%, rgba(124,200,255,0.10), transparent 55%),
                radial-gradient(circle at 75% 30%, rgba(236,72,153,0.06), transparent 60%),
                linear-gradient(180deg, rgba(2,6,23,0.35), rgba(2,6,23,0.15))
              `,
              filter: 'blur(0.2px)',
            }}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-60"
            style={{
              background: 'linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.03) 22%, transparent 45%)',
              transform: 'translateX(-12%)',
              maskImage: 'radial-gradient(circle at 50% 30%, black 45%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black 45%, transparent 70%)',
            }}
          />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className={capsuleWrap}>
                <div className={capsuleInner}>
                  <div className="pointer-events-none absolute inset-0 rounded-2xl xpot-capsule-border" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-70 xpot-capsule-glow" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-65 xpot-sheen" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-60 xpot-capsule-shimmer" />

                  <span className={capsuleTag}>
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 xpot-dot" />
                    Today&apos;s XPOT
                  </span>

                  <div className="min-w-0 px-1 text-center">
                    <span className={capsuleValue} style={{ textShadow: '0 0 22px rgba(124,200,255,0.10)' }}>
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
                'relative overflow-hidden rounded-2xl border bg-black/30 px-4 py-4 sm:px-5',
                justUpdated ? 'border-sky-400/35' : 'border-slate-800/70',
              ].join(' ')}
              style={{
                background:
                  'radial-gradient(circle_at_20%_25%, rgba(56,189,248,0.11), transparent 55%), radial-gradient(circle_at_80%_20%, rgba(236,72,153,0.08), transparent 60%), linear-gradient(180deg, rgba(2,6,23,0.34), rgba(0,0,0,0.06))',
              }}
            >
              {/* ambient aura */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-10 rounded-[28px] xpot-ambient-breathe"
                style={{
                  background:
                    'radial-gradient(circle at 18% 35%, rgba(124,200,255,0.14), transparent 58%), radial-gradient(circle at 82% 18%, rgba(236,72,153,0.10), transparent 62%)',
                  filter: 'blur(22px)',
                }}
              />

              {/* micro grid shimmer drift (super subtle) */}
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
                <div
                  className="absolute inset-0 xpot-grid-drift"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    maskImage:
                      'radial-gradient(circle at 40% 35%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.35) 40%, transparent 72%)',
                    WebkitMaskImage:
                      'radial-gradient(circle at 40% 35%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.35) 40%, transparent 72%)',
                  }}
                />
              </div>

              {/* update aura (tick only) */}
              <div
                aria-hidden
                className={[
                  'pointer-events-none absolute -inset-2 rounded-3xl opacity-0 transition-opacity duration-300',
                  justUpdated ? 'opacity-100' : '',
                ].join(' ')}
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, rgba(124,200,255,0.18), transparent 55%), radial-gradient(circle at 80% 20%, rgba(236,72,153,0.11), transparent 60%)',
                  filter: 'blur(10px)',
                }}
              />

              {/* premium sweep */}
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div
                  className={[
                    'absolute -left-1/2 top-0 h-full w-1/2 opacity-[0.18]',
                    justUpdated ? 'opacity-[0.36]' : '',
                    'xpot-live-sweep',
                  ].join(' ')}
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 40%, rgba(124,200,255,0.14) 55%, transparent 100%)',
                    filter: 'blur(0.3px)',
                  }}
                />
              </div>

              {/* slightly tighter top spacing so the number owns the card */}
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-end sm:gap-3">
                  <div className="relative">
                    <div
                      aria-hidden
                      className={[
                        'pointer-events-none absolute inset-0 translate-y-[2px] blur-[12px] opacity-60',
                        justUpdated ? 'opacity-100' : '',
                      ].join(' ')}
                      style={{
                        background:
                          'radial-gradient(circle at 30% 40%, rgba(124,200,255,0.28), transparent 60%), radial-gradient(circle at 80% 25%, rgba(236,72,153,0.18), transparent 62%)',
                      }}
                    />

                    <div
                      className={[
                        'relative xpot-usd-live xpot-usd-float font-semibold tabular-nums transition-all duration-300 ease-out',
                        justUpdated ? 'scale-[1.02]' : '',
                        justUpdated
                          ? 'text-[#7CC8FF] drop-shadow-[0_0_54px_rgba(124,200,255,0.22)]'
                          : 'text-white',
                      ].join(' ')}
                      style={{
                        ...usdClampStyle,
                        textShadow: justUpdated ? '0 0 40px rgba(124,200,255,0.18)' : '0 0 30px rgba(124,200,255,0.12)',
                        letterSpacing: isHero ? '-0.03em' : '-0.02em',
                      }}
                    >
                      {displayUsdText}
                    </div>

                    <div
                      aria-hidden
                      className={[
                        'pointer-events-none absolute -right-2 -top-2 hidden sm:block transition-opacity duration-300',
                        justUpdated ? 'opacity-100' : 'opacity-0',
                      ].join(' ')}
                    >
                      <div className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(124,200,255,0.55)]" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:mb-2">
                    <UsdEstimateBadge compact />
                    <span className="hidden text-[11px] uppercase tracking-[0.22em] text-slate-500 sm:inline">
                      Estimated value
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 sm:mb-2 sm:justify-end">
                  <span
  className={[
    'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03]',
    // responsive sizing
    'px-2 py-0.5 text-[9px] sm:px-2.5 sm:py-1 sm:text-[10px] md:px-3',
    'font-semibold uppercase tracking-[0.18em] text-slate-300',
    'transition-shadow',
    justUpdated
      ? 'shadow-[0_0_0_1px_rgba(124,200,255,0.18),0_0_22px_rgba(59,167,255,0.10)]'
      : '',
  ].join(' ')}
  aria-label="Live"
  title="Live"
>
  <span className="h-1.5 w-1.5 rounded-full bg-sky-300 xpot-dot" />
  <span className="leading-none">Live</span>
</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span
                  className={[
                    'inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300 transition-shadow',
                    countPulse
                      ? 'shadow-[0_0_0_1px_rgba(124,200,255,0.16),0_0_18px_rgba(59,167,255,0.10)]'
                      : '',
                  ].join(' ')}
                >
                  Next draw in
                </span>

                <span
                  className={[
                    'font-mono transition-colors duration-300',
                    isHero ? 'text-[15px] tracking-[0.30em] sm:text-base' : 'text-sm tracking-[0.26em]',
                    countPulse ? 'text-white' : 'text-slate-100',
                  ].join(' ')}
                  style={{ textShadow: '0 0 18px rgba(124,200,255,0.10)' }}
                >
                  {mounted ? new Date(Math.max(0, countdownMs)).toISOString().slice(11, 19) : '00:00:00'}
                </span>

                <span className="text-[11px] text-slate-600">22:00 Madrid</span>
              </div>

              {showUnavailable ? (
                <div className="mt-3">
                  <PriceUnavailableNote />
                </div>
              ) : (
                <p className="mt-2 text-center text-xs text-slate-500 sm:text-left">Live market price feed</p>
              )}

              {/* Latest winner (DISABLED until admin is fixed) */}
              {/*
                Winner strip intentionally disabled.
              */}
            </div>

            <details className="mt-0 group">
              <summary
                className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-slate-800/70 bg-black/15 px-4 py-3 text-sm text-slate-200 transition hover:bg-black/20"
                aria-label="Open more details"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    More details
                  </span>
                  <span className="text-xs text-slate-400">Token info, range, milestones</span>
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>

              <div className="mt-3">
                <div className="mt-1 grid gap-3 sm:grid-cols-2">
                  <div
                    className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-black/20 px-4 py-3"
                    style={{
                      background:
                        'radial-gradient(circle_at_18%_18%, rgba(124,200,255,0.08), transparent 58%), radial-gradient(circle_at_80%_20%, rgba(236,72,153,0.05), transparent 62%), linear-gradient(180deg, rgba(2,6,23,0.35), rgba(15,23,42,0.00))',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700/60 bg-black/30 shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_10px_22px_rgba(0,0,0,0.35)]">
                          <XpotLogo variant="mark" width={28} height={28} tone="gold" priority />
                        </span>

                        <div className="leading-tight">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-200">XPOT token</p>
                          <p className="text-xs text-slate-300">Winners are paid in XPOT</p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                        <Sparkles className="h-3.5 w-3.5 opacity-90" />
                        Verified
                      </span>
                    </div>

                    <p className="mt-3 text-[11px] text-slate-500">USD value is an estimate only.</p>
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
                        Source <span className="font-mono text-slate-200">DexScreener</span>
                      </span>
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
                              <span className="text-[11px] text-slate-500">({Math.round(progressToNext * 100)}%)</span>
                            </>
                          ) : (
                            '-'
                          )}
                        </p>
                      </div>

                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/60 bg-black/25">
                        <Crown className="h-4 w-4 text-slate-200/80" />
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="relative h-2 overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full shadow-[0_0_18px_rgba(59,167,255,0.12)]"
                          style={{
                            width: `${Math.round(progressToNext * 100)}%`,
                            background: 'linear-gradient(90deg, rgba(236,72,153,0.28), rgba(124,200,255,0.60))',
                          }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-200">{leftMilestoneLabel}</span>
                        <span className="font-mono text-slate-200">{rightMilestoneLabel}</span>
                      </div>

                      <p className="mt-2 text-[11px] text-slate-600">
                        Today&apos;s pool is fixed at {JACKPOT_XPOT.toLocaleString()} XPOT.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-4 overflow-hidden rounded-2xl border border-slate-800/70 bg-black/15 px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-2">
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

                      <p className="text-[11px] text-slate-500">
                        Hold XPOT to qualify. Claim your daily entry in the hub. Winners are published handle-first and
                        paid on-chain with proof.
                      </p>
                    </div>

                    <Link
                      href="/hub"
                      className="shrink-0 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:bg-emerald-400/20 hover:text-emerald-100"
                    >
                      Claim today&apos;s entry →
                    </Link>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-500">
                    Live price - updates every {Math.round(PRICE_POLL_MS / 1000)}s
                  </p>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
