// components/JackpotPanel/JackpotPanel.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Crown, ExternalLink, Info, Sparkles, TrendingUp, ChevronDown } from 'lucide-react';

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

  // New: optional "hero" mode used on homepage
  mode?: JackpotPanelMode;
};

const JACKPOT_XPOT = XPOT_POOL_SIZE;
const PRICE_POLL_MS = 4000; // 4s
const WINNER_POLL_MS = 15_000; // 15s

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

type LatestWinner = {
  id?: string | null;
  drawDate?: string | null; // ISO
  amount?: number | null;
  handle?: string | null;
  wallet?: string | null;
  txSignature?: string | null;
};

function shortWallet(w: string, head = 4, tail = 4) {
  if (!w) return '';
  if (w.length <= head + tail + 3) return w;
  return `${w.slice(0, head)}…${w.slice(-tail)}`;
}

function timeAgo(iso: string | null | undefined) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const diff = Date.now() - t;
  if (!Number.isFinite(diff)) return null;

  const s = Math.floor(diff / 1000);
  if (s < 15) return 'just now';
  if (s < 60) return `${s}s ago`;

  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;

  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function pickTxSignature(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const candidates = [obj.txSignature, obj.txSig, obj.tx, obj.signature, obj.txHash, obj.transaction];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 20) return c;
  }
  return null;
}

function solscanTxUrl(sig: string) {
  return `https://solscan.io/tx/${encodeURIComponent(sig)}`;
}

function internalWinnerUrl(id: string) {
  return `/winners/${encodeURIComponent(id)}`;
}

function normalizeHandle(h: string | null | undefined) {
  if (!h) return null;
  const s = String(h).trim();
  if (!s) return null;
  return s.replace(/^@/, '');
}

function xProfileUrl(handle: string) {
  return `https://x.com/${encodeURIComponent(handle)}`;
}

function xAvatarUrl(handle: string) {
  // Unavatar is simple + fast for social avatars.
  return `https://unavatar.io/twitter/${encodeURIComponent(handle)}`;
}

async function fetchLatestWinner(signal?: AbortSignal): Promise<LatestWinner | null> {
  const tryUrls = ['/api/winners/latest', '/api/winners/recent?limit=1'];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', signal, cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();

      if (data?.winner) {
        const w = data.winner;
        return {
          id: w.id ?? null,
          drawDate: w.drawDate ?? w.date ?? null,
          amount: typeof w.amount === 'number' ? w.amount : w.amount != null ? Number(w.amount) : null,
          handle: w.handle ?? w.xHandle ?? null,
          wallet: w.wallet ?? w.walletAddress ?? null,
          txSignature: pickTxSignature(w),
        };
      }

      const arr = Array.isArray(data) ? data : Array.isArray(data?.winners) ? data.winners : null;
      if (arr?.length) {
        const w = arr[0];
        return {
          id: w.id ?? null,
          drawDate: w.drawDate ?? w.date ?? null,
          amount: typeof w.amount === 'number' ? w.amount : w.amount != null ? Number(w.amount) : null,
          handle: w.handle ?? w.xHandle ?? null,
          wallet: w.wallet ?? w.walletAddress ?? null,
          txSignature: pickTxSignature(w),
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
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

  const [latestWinner, setLatestWinner] = useState<LatestWinner | null>(null);
  const [winnerHadError, setWinnerHadError] = useState(false);
  const [winnerPulse, setWinnerPulse] = useState(false);
  const winnerPulseTimer = useRef<number | null>(null);
  const lastWinnerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timer: number | null = null;
    const ctrl = new AbortController();

    const tick = async () => {
      const w = await fetchLatestWinner(ctrl.signal);
      if (!w) return;

      setWinnerHadError(false);

      const incomingId =
        (w.id ?? `${w.drawDate ?? ''}-${w.wallet ?? ''}-${w.amount ?? ''}-${w.txSignature ?? ''}`) || null;
      const prevId = lastWinnerIdRef.current;

      setLatestWinner(w);

      if (incomingId && incomingId !== prevId) {
        lastWinnerIdRef.current = incomingId;
        setWinnerPulse(true);
        if (winnerPulseTimer.current) window.clearTimeout(winnerPulseTimer.current);
        winnerPulseTimer.current = window.setTimeout(() => setWinnerPulse(false), 1400);
      }
    };

    tick().catch(() => setWinnerHadError(true));

    timer = window.setInterval(() => {
      tick().catch(() => setWinnerHadError(true));
    }, WINNER_POLL_MS);

    return () => {
      ctrl.abort();
      if (timer) window.clearInterval(timer);
      if (winnerPulseTimer.current) window.clearTimeout(winnerPulseTimer.current);
    };
  }, []);

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
      ? 'w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-5 py-5 shadow-sm'
      : 'w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-5 sm:px-6 sm:py-6';

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

  const normalizedHandle = normalizeHandle(latestWinner?.handle ?? null);
  const winnerLabel = normalizedHandle ? `@${normalizedHandle}` : null;
  const winnerWallet = latestWinner?.wallet ? shortWallet(latestWinner.wallet) : null;
  const winnerName = winnerLabel ?? winnerWallet ?? null;

  const winnerAmount =
    typeof latestWinner?.amount === 'number' && Number.isFinite(latestWinner.amount)
      ? latestWinner.amount.toLocaleString()
      : JACKPOT_XPOT.toLocaleString();

  const winnerAgo = timeAgo(latestWinner?.drawDate);
  const showWinnerStrip = !!winnerName && !winnerHadError;

  const solscanHref = latestWinner?.txSignature ? solscanTxUrl(latestWinner.txSignature) : null;
  const internalHref = !solscanHref && latestWinner?.id ? internalWinnerUrl(latestWinner.id) : null;

  // Winner primary link: X profile if we have a handle. Otherwise fallback to internal/solscan.
  const xHref = normalizedHandle ? xProfileUrl(normalizedHandle) : null;
  const winnerPrimaryHref = xHref ?? internalHref ?? solscanHref ?? null;

  const WinnerWrapper: React.ElementType = winnerPrimaryHref ? 'a' : 'div';
  const winnerWrapperProps = winnerPrimaryHref
    ? {
        href: winnerPrimaryHref,
        target: xHref || solscanHref ? '_blank' : undefined,
        rel: xHref || solscanHref ? 'noreferrer noopener' : undefined,
        'aria-label': xHref
          ? 'Open X profile'
          : solscanHref
            ? 'Open Solscan transaction'
            : 'Open winner receipt',
      }
    : {};

  return (
    <section
      className={[
        'relative transition-colors duration-300',
        panelChrome,
        // hero dominance: lift slightly
        isHero ? '-mt-3 sm:-mt-5' : '',
      ].join(' ')}
    >
      <style jsx global>{`
        @keyframes xpotWinnerSweep {
          0% {
            transform: translateX(-120%) skewX(-18deg);
            opacity: 0;
          }
          12% {
            opacity: 0.9;
          }
          55% {
            opacity: 0.9;
          }
          100% {
            transform: translateX(140%) skewX(-18deg);
            opacity: 0;
          }
        }
        @keyframes xpotWinnerGlint {
          0%,
          100% {
            opacity: 0;
            transform: translateY(0px);
          }
          25% {
            opacity: 0.65;
            transform: translateY(-1px);
          }
          60% {
            opacity: 0.3;
            transform: translateY(0px);
          }
        }
      `}</style>

      <div>
        {!!badgeLabel && (
          <div className="relative z-10 mb-4 flex justify-center">
            <RunwayBadge label={badgeLabel} tooltip={badgeTooltip} />
          </div>
        )}

        {/* HEADER */}
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-100">Today&apos;s XPOT</p>
            <p className="mt-1 text-xs text-slate-400">Live value, next draw countdown, and the latest winner.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.55)]" />
              Live
            </span>
          </div>
        </div>

        {/* MAIN SLAB (background removed completely) */}
        <div
          ref={slabRef}
          className={[
            'relative z-10 mt-4 overflow-hidden border-y border-slate-800/80 bg-transparent px-4 py-4 sm:rounded-2xl sm:border sm:p-5',
            layout === 'wide' ? 'w-full' : '',
            layout === 'auto' && autoWide ? 'w-full' : '',
          ].join(' ')}
        >
          {/* Marketing row */}
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

          {/* Big USD */}
          <div className="relative mt-5 grid gap-4">
            <div
              className={[
                'relative overflow-visible rounded-2xl border bg-black/30 px-4 py-4 sm:px-5',
                justUpdated ? 'border-sky-400/35' : 'border-slate-800/70',
              ].join(' ')}
              style={{
                background:
                  'radial-gradient(circle_at_20%_25%, rgba(56,189,248,0.08), transparent 55%), radial-gradient(circle_at_80%_20%, rgba(236,72,153,0.05), transparent 60%), linear-gradient(180deg, rgba(2,6,23,0.30), rgba(0,0,0,0.05))',
              }}
            >
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-end sm:gap-3">
                  <div
                    className={[
                      'xpot-usd-live text-4xl font-semibold tabular-nums transition-transform transition-colors duration-200 sm:text-[4.25rem]',
                      justUpdated ? 'scale-[1.01]' : '',
                      justUpdated ? 'text-[#7CC8FF]' : 'text-white',
                    ].join(' ')}
                    style={{ textShadow: '0 0 26px rgba(124,200,255,0.12)' }}
                  >
                    {displayUsdText}
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
                      'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300 transition-shadow',
                      justUpdated
                        ? 'shadow-[0_0_0_1px_rgba(124,200,255,0.14),0_0_16px_rgba(59,167,255,0.08)]'
                        : '',
                    ].join(' ')}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 xpot-dot" />
                    Updating live
                  </span>
                </div>
              </div>

              {/* countdown */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span
                  className={[
                    'inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300 transition-shadow',
                    countPulse
                      ? 'shadow-[0_0_0_1px_rgba(124,200,255,0.14),0_0_16px_rgba(59,167,255,0.08)]'
                      : '',
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

              {/* Latest winner */}
              {showWinnerStrip && (
                <WinnerWrapper
                  {...winnerWrapperProps}
                  className={[
                    'group mt-4 block overflow-hidden rounded-2xl border px-4 py-3 transition',
                    winnerPrimaryHref ? 'cursor-pointer' : '',
                    winnerPulse ? 'ring-2 ring-[#FFD27A]/30' : '',
                    winnerPrimaryHref ? 'hover:border-[#FFD27A]/35 hover:bg-black/30' : '',
                  ].join(' ')}
                  style={{
                    borderColor: 'rgba(255,210,122,0.22)',
                    background:
                      'radial-gradient(circle_at_14%_22%, rgba(255,210,122,0.22), transparent 56%),' +
                      'radial-gradient(circle_at_70%_18%, rgba(245,200,76,0.14), transparent 58%),' +
                      'radial-gradient(circle_at_86%_72%, rgba(56,189,248,0.10), transparent 60%),' +
                      'linear-gradient(180deg, rgba(2,6,23,0.30), rgba(0,0,0,0.10))',
                    boxShadow: winnerPulse
                      ? '0 0 0 1px rgba(255,210,122,0.22), 0 0 44px rgba(245,200,76,0.16)'
                      : winnerPrimaryHref
                        ? '0 0 0 1px rgba(255,210,122,0.14), 0 0 28px rgba(245,200,76,0.10)'
                        : '0 0 0 1px rgba(255,255,255,0.04)',
                  }}
                >
                  {winnerPulse && (
                    <div className="pointer-events-none absolute inset-0">
                      <div
                        className="absolute -inset-y-10 left-0 w-[55%]"
                        style={{
                          background:
                            'linear-gradient(90deg, rgba(255,255,255,0.00), rgba(255,226,160,0.14), rgba(245,200,76,0.30), rgba(255,226,160,0.14), rgba(255,255,255,0.00))',
                          filter: 'blur(1px)',
                          animation: 'xpotWinnerSweep 1200ms ease-out 1',
                          willChange: 'transform, opacity',
                        }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'radial-gradient(circle_at_28%_40%, rgba(255,226,160,0.14), transparent 45%),' +
                            'radial-gradient(circle_at_70%_35%, rgba(245,200,76,0.10), transparent 55%)',
                          animation: 'xpotWinnerGlint 1200ms ease-out 1',
                        }}
                      />
                    </div>
                  )}

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background: 'linear-gradient(180deg, #FFE39A, #F5C84C)',
                            boxShadow:
                              '0 0 16px rgba(245,200,76,0.65), 0 0 46px rgba(245,200,76,0.28)',
                          }}
                        />
                        <p
                          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                          style={{ color: 'rgba(255,226,160,0.95)' }}
                        >
                          Latest winner
                        </p>
                        {winnerAgo && (
                          <span className="text-[10px] uppercase tracking-[0.20em] text-slate-500">{winnerAgo}</span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-3">
                        {normalizedHandle ? (
                          <span className="relative shrink-0">
                            {/* avatar */}
                            <span
                              className="absolute -inset-[2px] rounded-full"
                              style={{
                                background:
                                  'radial-gradient(circle_at_35%_30%, rgba(255,226,160,0.35), transparent 62%)',
                              }}
                            />
                            <img
                              src={xAvatarUrl(normalizedHandle)}
                              alt={`${winnerLabel ?? 'Winner'} avatar`}
                              className="relative h-10 w-10 rounded-full border"
                              style={{
                                borderColor: 'rgba(255,210,122,0.28)',
                                boxShadow: '0 0 24px rgba(245,200,76,0.14)',
                              }}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={e => {
                                const el = e.currentTarget;
                                el.style.display = 'none';
                              }}
                            />
                            {/* fallback initial */}
                            <span
                              className="pointer-events-none absolute inset-0 hidden items-center justify-center rounded-full border text-sm font-semibold"
                              style={{
                                borderColor: 'rgba(255,210,122,0.28)',
                                color: 'rgba(255,226,160,0.96)',
                                background: 'rgba(0,0,0,0.22)',
                              }}
                              aria-hidden
                            >
                              {normalizedHandle.slice(0, 1).toUpperCase()}
                            </span>
                          </span>
                        ) : null}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span
                              className={[
                                'max-w-full truncate text-sm font-semibold',
                                winnerPrimaryHref ? 'group-hover:underline decoration-[#FFD27A]/45' : '',
                              ].join(' ')}
                              style={{
                                color: 'rgba(255,226,160,0.98)',
                                textShadow: '0 0 22px rgba(245,200,76,0.22)',
                              }}
                            >
                              {winnerName}
                            </span>

                            <span className="text-[11px] text-slate-600">·</span>

                            <span
                              className="font-mono text-sm"
                              style={{
                                color: 'rgba(255,226,160,0.98)',
                                textShadow:
                                  '0 0 22px rgba(245,200,76,0.26), 0 0 46px rgba(245,200,76,0.12)',
                              }}
                            >
                              {winnerAmount} XPOT
                            </span>
                          </div>

                          {normalizedHandle ? (
                            <p className="mt-1 text-[11px] text-slate-400">Open X profile</p>
                          ) : (
                            <p className="mt-1 text-[11px] text-slate-400">Winner</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {solscanHref ? (
                        <a
                          href={solscanHref}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition hover:opacity-100"
                          style={{
                            borderColor: 'rgba(255,210,122,0.26)',
                            background: 'rgba(255,210,122,0.10)',
                            color: 'rgba(255,226,160,0.96)',
                            boxShadow: '0 0 28px rgba(245,200,76,0.14)',
                            opacity: 0.92,
                          }}
                          aria-label="Verify on Solscan"
                          onClick={e => e.stopPropagation()}
                        >
                          Verify
                          <ExternalLink className="h-3.5 w-3.5 opacity-90" />
                        </a>
                      ) : (
                        <span
                          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                          style={{
                            borderColor: 'rgba(255,210,122,0.18)',
                            background: 'rgba(255,210,122,0.08)',
                            color: 'rgba(255,226,160,0.92)',
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5 opacity-90" />
                          Winner
                        </span>
                      )}
                    </div>
                  </div>
                </WinnerWrapper>
              )}

              {/* Everything else closed by default */}
              <details className="mt-4 group">
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
                  {/* Token info row */}
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

                  {/* Telemetry strip */}
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
                                  ({Math.round(progressToNext * 100)}%)
                                </span>
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

                  {/* CONTEXT STRIP */}
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
                        className="shrink-0 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:bg-emerald-400/20 hover:text-emerald-100"
                      >
                        Enter today&apos;s XPOT →
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
      </div>
    </section>
  );
}
