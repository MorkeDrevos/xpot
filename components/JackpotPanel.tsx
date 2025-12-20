// components/JackpotPanel.tsx
'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Crown, Info, Sparkles, TrendingUp } from 'lucide-react';
import { TOKEN_MINT, XPOT_POOL_SIZE } from '@/lib/xpot';
import XpotLogo from '@/components/XpotLogo';

const JACKPOT_XPOT = XPOT_POOL_SIZE;
const PRICE_POLL_MS = 2000; // 2s

// 24h observed range via rolling samples
const RANGE_SAMPLE_MS = 10_000; // store one sample every 10s
const RANGE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const RANGE_STORAGE_KEY = 'xpot_price_samples_24h_v1';
const RANGE_MAX_SAMPLES = Math.ceil(RANGE_WINDOW_MS / RANGE_SAMPLE_MS) + 120;

// Sparkline window (local ticks)
const SPARK_WINDOW_MS = 60 * 60 * 1000; // 1h
const SPARK_MAX_POINTS = 80;

type JackpotPanelProps = {
  isLocked?: boolean;
  onJackpotUsdChange?: (value: number | null) => void;

  // Visual variants
  variant?: 'standalone' | 'embedded';

  // Badge in header (eg "10+ year runway")
  badgeLabel?: string;
  badgeTooltip?: string;

  // Layout
  layout?: 'auto' | 'wide';
};

type PriceSource = 'Jupiter' | 'DexScreener';

// Private-vault gold (muted, heavier, less neon)
const VAULT_GOLD = {
  rgb: '201 162 74', // bronze-gold
  rgbSoft: '173 138 58', // deeper bronze for borders/shadows
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function formatUsd(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '$0.00';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function formatCoverage(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * "Session" key that flips at 22:00 Madrid time.
 */
function getMadridSessionKey(cutoffHour = 22) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const year = Number(parts.find(p => p.type === 'year')?.value ?? '0');
  const month = Number(parts.find(p => p.type === 'month')?.value ?? '1');
  const day = Number(parts.find(p => p.type === 'day')?.value ?? '1');
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? '0');

  const base = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (hour >= cutoffHour) base.setUTCDate(base.getUTCDate() + 1);

  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, '0');
  const d = String(base.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/* ─────────────────────────────────────────────
   Madrid cutoff: correct UTC ms for "22:00 Europe/Madrid"
   (DST-safe, no UTC/Madrid drift)
───────────────────────────────────────────── */

function getMadridParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: string, fallback = '0') => Number(parts.find(p => p.type === type)?.value ?? fallback);

  return {
    y: get('year', '0'),
    m: get('month', '1'),
    d: get('day', '1'),
    hh: get('hour', '0'),
    mm: get('minute', '0'),
    ss: get('second', '0'),
  };
}

function getMadridOffsetMs(now = new Date()) {
  // Convert Madrid wall-clock parts back to UTC ms and compare to actual now.
  // The difference is the tz offset in ms (handles DST correctly).
  const p = getMadridParts(now);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return asUtc - now.getTime();
}

function getNextMadridCutoffUtcMs(cutoffHour = 22, now = new Date()) {
  const p = getMadridParts(now);
  const offsetMs = getMadridOffsetMs(now);

  const mkUtcFromMadridWallClock = (yy: number, mm: number, dd: number, hh: number, mi: number, ss: number) => {
    const asUtc = Date.UTC(yy, mm - 1, dd, hh, mi, ss);
    return asUtc - offsetMs;
  };

  let targetUtc = mkUtcFromMadridWallClock(p.y, p.m, p.d, cutoffHour, 0, 0);

  if (now.getTime() >= targetUtc) {
    const base = new Date(Date.UTC(p.y, p.m - 1, p.d, 0, 0, 0));
    base.setUTCDate(base.getUTCDate() + 1);
    const yy = base.getUTCFullYear();
    const mm = base.getUTCMonth() + 1;
    const dd = base.getUTCDate();
    targetUtc = mkUtcFromMadridWallClock(yy, mm, dd, cutoffHour, 0, 0);
  }

  return targetUtc;
}

function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

// Milestone ladder for highlights (USD) - start at $5
const MILESTONES = [
  5, 10, 15, 20, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1_000, 1_500, 2_000, 3_000, 4_000, 5_000, 7_500,
  10_000, 15_000, 20_000, 30_000, 40_000, 50_000, 75_000, 100_000, 150_000, 200_000, 300_000, 400_000, 500_000,
  750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000,
];

type PriceSample = { t: number; p: number };

function safeParseSamples(raw: string | null): PriceSample[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: PriceSample[] = [];
    for (const item of v) {
      const t = Number((item as any)?.t);
      const p = Number((item as any)?.p);
      if (Number.isFinite(t) && Number.isFinite(p)) out.push({ t, p });
    }
    return out;
  } catch {
    return [];
  }
}

function buildSparklinePoints(samples: PriceSample[], width: number, height: number) {
  if (samples.length < 2) return null;

  let min = Infinity;
  let max = -Infinity;
  for (const s of samples) {
    if (s.p < min) min = s.p;
    if (s.p > max) max = s.p;
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const span = Math.max(1e-12, max - min);

  const n = samples.length;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * width;
    const yNorm = (samples[i].p - min) / span;
    const y = height - yNorm * height;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return { points: pts.join(' '), min, max };
}

function readJupiterUsdPrice(payload: unknown, mint: string): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const p: any = payload;

  const a = p?.[mint]?.usdPrice;
  if (typeof a === 'number' && Number.isFinite(a)) return a;

  const b = p?.data?.[mint]?.price;
  if (typeof b === 'number' && Number.isFinite(b)) return b;

  const c = p?.data?.[mint]?.usdPrice;
  if (typeof c === 'number' && Number.isFinite(c)) return c;

  return null;
}

type DexMetrics = {
  priceUsd: number | null;
  changeH1: number | null;
};

function readDexScreenerMetrics(payload: unknown): DexMetrics {
  if (!payload || typeof payload !== 'object') return { priceUsd: null, changeH1: null };
  const p: any = payload;
  const pairs = Array.isArray(p?.pairs) ? p.pairs : [];
  if (!pairs.length) return { priceUsd: null, changeH1: null };

  // Prefer Solana + highest liquidity
  let best: any = null;
  for (const pair of pairs) {
    const priceUsd = Number(pair?.priceUsd ?? NaN);
    if (!Number.isFinite(priceUsd)) continue;

    if (!best) {
      best = pair;
      continue;
    }

    const chainOk = (pair?.chainId ?? '').toString().toLowerCase() === 'solana';
    const bestChainOk = (best?.chainId ?? '').toString().toLowerCase() === 'solana';

    const liqUsd = Number(pair?.liquidity?.usd ?? 0);
    const bestLiq = Number(best?.liquidity?.usd ?? 0);

    const better = (chainOk && !bestChainOk) || liqUsd > bestLiq;
    if (better) best = pair;
  }

  const outPrice = Number(best?.priceUsd ?? NaN);
  const outChange = Number(best?.priceChange?.h1 ?? NaN);

  return {
    priceUsd: Number.isFinite(outPrice) ? outPrice : null,
    changeH1: Number.isFinite(outChange) ? outChange : null,
  };
}

/* -----------------------------
   Tooltips (clamped + normal width)
------------------------------ */

function useAnchoredTooltip() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const update = () => {
    if (!ref.current) return;
    setRect(ref.current.getBoundingClientRect());
  };

  useEffect(() => {
    if (!open) return;
    update();

    const onMove = () => update();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);

    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { ref, open, setOpen, rect };
}

function TooltipBubble({
  open,
  rect,
  width = 380,
  children,
}: {
  open: boolean;
  rect: DOMRect | null;
  width?: number;
  children: ReactNode;
}) {
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [h, setH] = useState<number>(160);

  useEffect(() => {
    if (!open) return;
    const el = bubbleRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.height && Number.isFinite(r.height)) setH(r.height);
  }, [open]);

  if (!open || !rect) return null;
  if (typeof window === 'undefined') return null;
  if (typeof document === 'undefined') return null;

  const pad = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const maxW = Math.max(240, vw - pad * 2);
  const w = clamp(width, 240, maxW);

  const anchorCenterX = rect.left + rect.width / 2;
  const left = clamp(anchorCenterX - w / 2, pad, Math.max(pad, vw - w - pad));

  const belowTop = rect.bottom + 10;
  const aboveTop = rect.top - 10 - h;

  const fitsBelow = belowTop + h <= vh - pad;
  const top = fitsBelow ? belowTop : clamp(aboveTop, pad, vh - h - pad);

  const arrowX = clamp(anchorCenterX - left, 22, w - 22);
  const arrowIsTop = fitsBelow;

  return createPortal(
    <div
      ref={bubbleRef}
      className="
        pointer-events-none fixed z-[9999]
        rounded-2xl border border-slate-700/80 bg-slate-950/95
        shadow-[0_18px_40px_rgba(15,23,42,0.92)] backdrop-blur-xl
      "
      style={{ left, top, width: w, opacity: 1, transform: 'translateY(4px)' }}
    >
      <div
        className={`
          absolute h-3.5 w-3.5 rotate-45 bg-slate-950/95
          shadow-[0_4px_10px_rgba(15,23,42,0.7)]
          ${arrowIsTop ? '-top-1.5 border-l border-t' : '-bottom-1.5 border-r border-b'}
          border-slate-700/80
        `}
        style={{ left: arrowX - 7 }}
      />
      {children}
    </div>,
    document.body,
  );
}

function UsdEstimateBadge({ compact }: { compact?: boolean }) {
  const t = useAnchoredTooltip();

  return (
    <div
      ref={t.ref}
      className="relative inline-flex items-center gap-2"
      onMouseEnter={() => t.setOpen(true)}
      onMouseLeave={() => t.setOpen(false)}
    >
      <span
        className={
          compact
            ? 'inline-flex items-center rounded-full border border-slate-700/60 bg-black/20 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.20em] text-slate-200'
            : 'inline-flex items-center rounded-full border border-slate-700/70 bg-black/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200'
        }
      >
        USD estimate
      </span>

      <button
        type="button"
        aria-label="USD estimate info"
        className={
          compact
            ? 'inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700/70 bg-black/20 text-slate-200 hover:bg-slate-900/40 hover:text-white transition'
            : 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/80 bg-black/20 text-slate-200 hover:bg-slate-900/40 hover:text-white transition'
        }
      >
        <Info className={compact ? 'h-3.5 w-3.5 opacity-90' : 'h-4 w-4 opacity-90'} />
      </button>

      <TooltipBubble open={t.open} rect={t.rect} width={380}>
        <div className="px-4 py-3 text-[12px] leading-snug text-slate-100">
          <p className="text-slate-100">Current USD value of today&apos;s XPOT, based on the live XPOT price from Jupiter.</p>
          <p className="mt-2 text-slate-400">
            Winner is paid in <span className="font-semibold text-[#7CC8FF]">XPOT</span>, not USD.
          </p>
        </div>
      </TooltipBubble>
    </div>
  );
}

function RunwayBadge({ label, tooltip }: { label: string; tooltip?: string }) {
  const t = useAnchoredTooltip();
  if (!label) return null;

  return (
    <div
      ref={t.ref}
      className="relative inline-flex items-center justify-center gap-2"
      onMouseEnter={() => t.setOpen(true)}
      onMouseLeave={() => t.setOpen(false)}
    >
      <span
        className="
          inline-flex items-center gap-2 rounded-full
          border border-emerald-400/30 bg-emerald-500/10
          px-4 py-1.5
          text-[9px] sm:text-[10px]
          font-semibold uppercase tracking-[0.22em]
          text-emerald-100
          shadow-[0_0_0_1px_rgba(16,185,129,0.08)]
          max-w-[92vw]
          cursor-default select-none
        "
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.85)]" />
        <span className="truncate">{label}</span>
      </span>

      {!!tooltip && (
        <>
          <button
            type="button"
            aria-label="More info"
            className="
              inline-flex h-9 w-9 items-center justify-center rounded-full
              border border-slate-700/80 bg-black/20
              text-slate-200
              hover:bg-slate-900/40 hover:text-white
              transition
            "
          >
            <Info className="h-4 w-4 opacity-90" />
          </button>

          <TooltipBubble open={t.open} rect={t.rect} width={340}>
            <div className="px-4 py-3 text-[12px] leading-snug text-slate-100 whitespace-pre-line select-none">{tooltip}</div>
          </TooltipBubble>
        </>
      )}
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
  const [priceSource, setPriceSource] = useState<PriceSource>('Jupiter');

  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);

  const [maxJackpotToday, setMaxJackpotToday] = useState<number | null>(null);

  // Soft drift animation for the big USD number
  const [displayJackpotUsd, setDisplayJackpotUsd] = useState<number | null>(null);

  // Pump glow + update pulse
  const [justPumped, setJustPumped] = useState(false);
  const pumpTimeout = useRef<number | null>(null);
  const prevJackpot = useRef<number | null>(null);

  const [justUpdated, setJustUpdated] = useState(false);
  const updatePulseTimeout = useRef<number | null>(null);

  // GLOBAL momentum (DexScreener priceChange.h1)
  const [momentumGlobalH1, setMomentumGlobalH1] = useState<number | null>(null);

  // 24h observed range (from rolling samples)
  const samplesRef = useRef<PriceSample[]>([]);
  const lastSampleAtRef = useRef<number>(0);
  const lastPersistAtRef = useRef<number>(0);

  const [range24h, setRange24h] = useState<{ lowUsd: number; highUsd: number } | null>(null);
  const [coverageMs, setCoverageMs] = useState<number>(0);

  // Sparkline (local ticks, last 1h)
  const [spark, setSpark] = useState<{ points: string; min: number; max: number } | null>(null);
  const [sparkCoverageMs, setSparkCoverageMs] = useState<number>(0);

  // Premium runway fade-in (after price loads)
  const [showRunway, setShowRunway] = useState(false);

  // Hydration-safe: only render time-based UI after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

    // Countdown - hydration safe (no Date() in initial render)
  const [nextDrawUtcMs, setNextDrawUtcMs] = useState<number>(0);
  const [countdownMs, setCountdownMs] = useState<number>(0);
  const [countPulse, setCountPulse] = useState(false);

  // After mount, compute the real cutoff once (DST-safe)
  useEffect(() => {
  if (!mounted) return;
  const nd = getNextMadridCutoffUtcMs(22, new Date());
  setNextDrawUtcMs(nd);
  setCountdownMs(Math.max(0, nd - Date.now()));
}, [mounted]);

    // Hydration-safe session key (avoid Date() during first render)
  const [sessionKey, setSessionKey] = useState('xpot_max_session_usd_boot');
  useEffect(() => {
    setSessionKey(`xpot_max_session_usd_${getMadridSessionKey(22)}`);
  }, []);

  // AUTO responsive wide switching (fixes ResizeObserver thrash -> React error)
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

    // hysteresis: once wide, don’t turn off until narrower than OFF; once not wide, don’t turn on until wider than ON
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

    // initial
    const initial = el.getBoundingClientRect().width;
    applyWidth(initial);

    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [layout]);

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

  // Listen for the shared countdown broadcast (from app/page.tsx NextDrawProvider)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onNextDraw = (e: Event) => {
      const ce = e as CustomEvent<any>;
      const nd = Number(ce?.detail?.nextDrawUtcMs);
      const now = Number(ce?.detail?.nowMs);
      if (!Number.isFinite(nd) || !Number.isFinite(now)) return;

      setNextDrawUtcMs(nd);
      setCountdownMs(Math.max(0, nd - now));
    };

    window.addEventListener('xpot:next-draw', onNextDraw as any);
    return () => window.removeEventListener('xpot:next-draw', onNextDraw as any);
  }, []);

  // Countdown ticker (second-aligned) using stored nextDrawUtcMs.
  useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!mounted) return;

  let interval: number | null = null;

  const tick = () => {
    const nd = nextDrawUtcMs || getNextMadridCutoffUtcMs(22, new Date());
    const now = Date.now();
    setCountdownMs(Math.max(0, nd - now));
    setCountPulse(p => !p);

    if (now >= nd) {
      const next = getNextMadridCutoffUtcMs(22, new Date());
      setNextDrawUtcMs(next);
    }
  };

  const msToNextSecond = 1000 - (Date.now() % 1000);
  const t = window.setTimeout(() => {
    tick();
    interval = window.setInterval(tick, 1000);
  }, msToNextSecond);

  return () => {
    window.clearTimeout(t);
    if (interval) window.clearInterval(interval);
  };
}, [nextDrawUtcMs, mounted]);

  // Load rolling samples (for 24h range + local sparkline)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    const cutoff24 = now - RANGE_WINDOW_MS;

    const stored = safeParseSamples(window.localStorage.getItem(RANGE_STORAGE_KEY))
      .filter(s => s.t >= cutoff24)
      .slice(-RANGE_MAX_SAMPLES);

    samplesRef.current = stored;
    lastSampleAtRef.current = stored.length ? stored[stored.length - 1].t : 0;

    if (stored.length >= 2) {
      let low = Infinity;
      let high = -Infinity;
      for (const s of stored) {
        if (s.p < low) low = s.p;
        if (s.p > high) high = s.p;
      }
      if (Number.isFinite(low) && Number.isFinite(high)) {
        setRange24h({ lowUsd: low * JACKPOT_XPOT, highUsd: high * JACKPOT_XPOT });
      }

      setCoverageMs(clamp(now - stored[0].t, 0, RANGE_WINDOW_MS));

      const cutoffSpark = now - SPARK_WINDOW_MS;
      const sparkRaw = stored.filter(s => s.t >= cutoffSpark);
      if (sparkRaw.length >= 2) {
        const step = Math.max(1, Math.floor(sparkRaw.length / SPARK_MAX_POINTS));
        const down: PriceSample[] = [];
        for (let i = 0; i < sparkRaw.length; i += step) down.push(sparkRaw[i]);
        if (down[down.length - 1] !== sparkRaw[sparkRaw.length - 1]) down.push(sparkRaw[sparkRaw.length - 1]);

        const built = buildSparklinePoints(down, 560, 54);
        setSpark(built ? { points: built.points, min: built.min, max: built.max } : null);
        setSparkCoverageMs(clamp(now - sparkRaw[0].t, 0, SPARK_WINDOW_MS));
      } else {
        setSpark(null);
        setSparkCoverageMs(0);
      }
    }
  }, []);

  useEffect(() => {
    if (showRunway) return;
    if (isLoading) return;
    if (priceUsd == null) return;
    if (displayJackpotUsd == null) return;

    const t = window.setTimeout(() => setShowRunway(true), 320);
    return () => window.clearTimeout(t);
  }, [isLoading, priceUsd, displayJackpotUsd, showRunway]);

  // Live price: Jupiter primary, DexScreener fallback
  useEffect(() => {
    let timer: number | null = null;
    let aborted = false;
    const ctrl = new AbortController();

    async function fetchFromJupiter(): Promise<number | null> {
      const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${TOKEN_MINT}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const json = await res.json();
      return readJupiterUsdPrice(json, TOKEN_MINT);
    }

    async function fetchFromDexScreener(): Promise<DexMetrics> {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_MINT}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      });
      if (!res.ok) return { priceUsd: null, changeH1: null };
      const json = await res.json();
      return readDexScreenerMetrics(json);
    }

    async function fetchPrice() {
      try {
        setHadError(false);

        const [jup, dex] = await Promise.allSettled([fetchFromJupiter(), fetchFromDexScreener()]);

        const jupPrice = jup.status === 'fulfilled' ? jup.value : null;
        const dexMetrics = dex.status === 'fulfilled' ? dex.value : { priceUsd: null, changeH1: null };

        if (!aborted) {
          if (dexMetrics.changeH1 != null) setMomentumGlobalH1(dexMetrics.changeH1);
        }

        let price: number | null = null;
        let src: PriceSource = 'Jupiter';

        if (typeof jupPrice === 'number' && Number.isFinite(jupPrice)) {
          price = jupPrice;
          src = 'Jupiter';
        } else if (typeof dexMetrics.priceUsd === 'number' && Number.isFinite(dexMetrics.priceUsd)) {
          price = dexMetrics.priceUsd;
          src = 'DexScreener';
        } else {
          price = null;
        }

        if (aborted) return;

        if (typeof price === 'number' && Number.isFinite(price)) {
          setPriceUsd(price);
          setPriceSource(src);

          setJustUpdated(true);
          if (updatePulseTimeout.current !== null) window.clearTimeout(updatePulseTimeout.current);
          updatePulseTimeout.current = window.setTimeout(() => setJustUpdated(false), 420);
        } else {
          setPriceUsd(null);
          setHadError(true);
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        console.error('[XPOT] price error:', err);
        if (aborted) return;
        setPriceUsd(null);
        setHadError(true);
      } finally {
        if (!aborted) setIsLoading(false);
      }
    }

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
  if (!mounted) return;
  if (sessionKey.endsWith('_boot')) return;

  setMaxJackpotToday(prev => {
    const next = prev == null ? jackpotUsd : Math.max(prev, jackpotUsd);
    window.localStorage.setItem(sessionKey, String(next));
    return next;
  });
}
  }, [jackpotUsd, sessionKey, onJackpotUsdChange, mounted]);

  // Soft USD drift animation for the big number (stale-safe)
const displayRef = useRef<number | null>(null);
useEffect(() => {
  displayRef.current = displayJackpotUsd;
}, [displayJackpotUsd]);

useEffect(() => {
  if (typeof window === 'undefined') return;

  // If live USD is missing, clear display
  if (jackpotUsd == null) {
    setDisplayJackpotUsd(null);
    displayRef.current = null;
    return;
  }

  const from = displayRef.current;

  // First time we get a value: set instantly (no animation)
  if (from == null || !Number.isFinite(from)) {
    setDisplayJackpotUsd(jackpotUsd);
    displayRef.current = jackpotUsd;
    return;
  }

  const to = jackpotUsd;
  const delta = Math.abs(to - from);

  // Tiny changes: snap
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

  // Update rolling 24h samples + compute observed high/low + coverage + local sparkline
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (priceUsd == null || !Number.isFinite(priceUsd)) return;

    const now = Date.now();
    const cutoff24 = now - RANGE_WINDOW_MS;

    if (now - lastSampleAtRef.current >= RANGE_SAMPLE_MS) {
      const arr = samplesRef.current;

      arr.push({ t: now, p: priceUsd });
      lastSampleAtRef.current = now;

      while (arr.length && arr[0].t < cutoff24) arr.shift();

      if (arr.length > RANGE_MAX_SAMPLES) {
        arr.splice(0, arr.length - RANGE_MAX_SAMPLES);
      }

      let low = Infinity;
      let high = -Infinity;
      for (const s of arr) {
        if (s.p < low) low = s.p;
        if (s.p > high) high = s.p;
      }
      if (Number.isFinite(low) && Number.isFinite(high)) {
        setRange24h({ lowUsd: low * JACKPOT_XPOT, highUsd: high * JACKPOT_XPOT });
      }

      if (arr.length >= 2) setCoverageMs(clamp(now - arr[0].t, 0, RANGE_WINDOW_MS));
      else setCoverageMs(0);

      const cutoffSpark = now - SPARK_WINDOW_MS;
      const sparkRaw = arr.filter(s => s.t >= cutoffSpark);

      if (sparkRaw.length >= 2) {
        const step = Math.max(1, Math.floor(sparkRaw.length / SPARK_MAX_POINTS));
        const down: PriceSample[] = [];
        for (let i = 0; i < sparkRaw.length; i += step) down.push(sparkRaw[i]);
        if (down[down.length - 1] !== sparkRaw[sparkRaw.length - 1]) down.push(sparkRaw[sparkRaw.length - 1]);

        const built = buildSparklinePoints(down, 560, 54);
        setSpark(built ? { points: built.points, min: built.min, max: built.max } : null);
        setSparkCoverageMs(clamp(now - sparkRaw[0].t, 0, SPARK_WINDOW_MS));
      } else {
        setSpark(null);
        setSparkCoverageMs(0);
      }

      if (now - lastPersistAtRef.current >= 60_000) {
        lastPersistAtRef.current = now;
        try {
          window.localStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify(arr));
        } catch {
          // ignore
        }
      }
    }
  }, [priceUsd]);

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
  const poolLabel = `${JACKPOT_XPOT.toLocaleString()} XPOT`;

  const displayUsdText =
    displayJackpotUsd === null || !Number.isFinite(displayJackpotUsd) ? '-' : formatUsd(displayJackpotUsd);

  const panelChrome =
    variant === 'embedded'
      ? 'rounded-2xl border border-slate-800/70 bg-slate-950/45 px-5 py-5 shadow-sm'
      : 'rounded-2xl border border-slate-800 bg-slate-950/60 px-6 py-6 shadow-sm';

  const observedLabel = coverageMs >= RANGE_WINDOW_MS ? 'Observed: 24h' : `Observed: ${formatCoverage(coverageMs)}`;
  const localSparkLabel =
    sparkCoverageMs >= SPARK_WINDOW_MS ? 'Local ticks: 1h' : `Local ticks: ${formatCoverage(sparkCoverageMs)}`;

  const isWide = layout === 'wide' || (layout === 'auto' && autoWide);

  const globalMomentumText =
    momentumGlobalH1 == null || !Number.isFinite(momentumGlobalH1) ? '-' : `${momentumGlobalH1.toFixed(2)}%`;

  const leftMilestoneLabel =
    (nextMilestone === 5 && (prevMilestoneForBar ?? 0) === 0) || (prevMilestoneForBar ?? 0) === 0
      ? 'Under $5'
      : formatUsd(prevMilestoneForBar ?? 0);

  const rightMilestoneLabel = nextMilestone ? formatUsd(nextMilestone) : '-';

  return (
    <section className={`relative transition-colors duration-300 ${panelChrome}`}>
      {/* Soft neon glow on pump */}
      <div
        className={`
          pointer-events-none absolute inset-0 rounded-2xl
          border border-[#3BA7FF]/40
          shadow-[0_0_40px_rgba(59,167,255,0.45)]
          opacity-0 transition-opacity duration-500
          ${justPumped ? 'opacity-100' : ''}
        `}
      />

      {!!badgeLabel && (
        <div
          className={`
            relative z-10 mb-4 flex justify-center
            transition-all duration-[900ms] ease-out
            ${showRunway ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}
          `}
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

        {/* keep only ONE live pill */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
            Live
          </span>
        </div>
      </div>

      {/* MAIN SLAB */}
      <div ref={slabRef} className="relative z-10 mt-5 rounded-2xl border border-slate-800/80 bg-black/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-[rgba(59,167,255,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7CC8FF]">
              Today&apos;s XPOT
            </span>

            {/* vault gold tuning */}
            <span
              className="relative inline-flex items-baseline rounded-2xl bg-black/45 px-5 py-2 font-mono text-lg tracking-[0.20em] text-slate-100 shadow-[0_0_0_1px_rgba(15,23,42,0.9),0_20px_60px_rgba(0,0,0,0.35)]"
              style={{
                border: `1px solid rgba(${VAULT_GOLD.rgbSoft} / 0.18)`,
              }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
                style={{
                  background: `
                    radial-gradient(circle_at_20%_30%, rgba(${VAULT_GOLD.rgb} / 0.12), transparent 56%),
                    radial-gradient(circle_at_80%_20%, rgba(124,200,255,0.08), transparent 58%)
                  `,
                }}
              />
              <span className="relative">{poolLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLocked && (
              <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200">
                Draw locked
              </span>
            )}
          </div>
        </div>

        {/* Value row */}
        <div
          className={
            isWide
              ? 'mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]'
              : 'mt-5 grid gap-4'
          }
        >
          {/* Big USD */}
          <div className="relative overflow-visible rounded-2xl border border-slate-800/70 bg-black/25 px-5 py-4">
            <div className="mt-4 flex items-end justify-between gap-3">
              <div
                className={`
                  text-5xl sm:text-6xl font-semibold tabular-nums
                  transition-transform transition-colors duration-200
                  ${justUpdated ? 'scale-[1.01]' : ''}
                  ${justPumped ? 'text-[#7CC8FF]' : 'text-white'}
                `}
              >
                {displayUsdText}
              </div>

              <div className="mb-1">
                <UsdEstimateBadge compact />
              </div>
            </div>

            {/* subtle premium sheen */}
            <div
              className="pointer-events-none absolute -inset-x-2 -top-2 h-10 opacity-50"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
              }}
            />

            {/* sexy countdown */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span
                className={`
                  inline-flex items-center rounded-full border border-white/10 bg-white/[0.03]
                  px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300
                  ${countPulse ? 'shadow-[0_0_0_1px_rgba(124,200,255,0.18),0_0_18px_rgba(59,167,255,0.10)]' : ''}
                  transition-shadow
                `}
              >
                Next draw in
              </span>

              <span
                className={`
                  font-mono text-sm tracking-[0.26em]
                  ${countPulse ? 'text-white' : 'text-slate-100'}
                  transition-colors
                `}
                style={{ textShadow: '0 0 18px rgba(124,200,255,0.10)' }}
              >
                {mounted ? formatCountdown(countdownMs) : '00:00:00'}
              </span>

              <span className="text-[11px] text-slate-600">22:00 Madrid</span>
            </div>

            <p className="mt-2 text-xs text-slate-500">Auto-updates from Jupiter ticks</p>
          </div>

          {/* Royal XPOT meta (credit card feel + private-vault gold) */}
          <div
            className="relative overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(2,6,23,0.35),rgba(15,23,42,0.0))] px-5 py-4 min-h-[170px]"
            style={{
              border: `1px solid rgba(${VAULT_GOLD.rgbSoft} / 0.20)`,
              boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.02)`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background: `
                  radial-gradient(circle_at_18%_18%, rgba(${VAULT_GOLD.rgb} / 0.12), transparent 58%),
                  radial-gradient(circle_at_82%_22%, rgba(236,72,153,0.06), transparent 62%),
                  radial-gradient(circle_at_60%_78%, rgba(59,167,255,0.07), transparent 58%)
                `,
              }}
            />

            {/* card sheen (dialed down) */}
            <div
              className="pointer-events-none absolute -inset-x-10 -top-10 h-28 rotate-[-8deg] opacity-[0.22]"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              }}
            />

            <div className="relative flex h-full flex-col">
              {/* Top row */}
              <div className="pt-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/25"
                    style={{
                      border: `1px solid rgba(${VAULT_GOLD.rgbSoft} / 0.22)`,
                      boxShadow: `0 0 0 1px rgba(0,0,0,0.35), 0 10px 22px rgba(0,0,0,0.35)`,
                    }}
                  >
                    <XpotLogo variant="mark" width={22} height={22} tone="gold" priority />
                  </span>

                  <div className="leading-tight">
                    <p
                      className="text-[10px] uppercase tracking-[0.24em]"
                      style={{ color: `rgba(${VAULT_GOLD.rgb} / 0.85)` }}
                    >
                      XPOT token
                    </p>
                    <p className="text-xs text-slate-300">Winners paid in XPOT</p>
                  </div>
                </div>

                <span
                  className="inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{
                    border: `1px solid rgba(${VAULT_GOLD.rgbSoft} / 0.22)`,
                    color: `rgba(${VAULT_GOLD.rgb} / 0.86)`,
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5 opacity-90" />
                  Verified
                </span>
              </div>

              {/* Bottom */}
              <div className="mt-auto pb-1 text-right">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">USD value</p>
                <p className="mt-1 text-sm text-slate-300">
                  1 XPOT ≈{' '}
                  <span className="font-mono text-slate-100">{priceUsd !== null ? priceUsd.toFixed(8) : '0.00000000'}</span>
                </p>

                <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-slate-500">
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

        {/* Compact premium telemetry strip */}
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {/* Pulse */}
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
                <svg
                  width="100%"
                  height="34"
                  viewBox="0 0 560 54"
                  className="block text-slate-300/70"
                  aria-label="XPOT pulse sparkline (local ticks)"
                >
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

          {/* 24h range */}
          <div className="rounded-2xl border border-slate-800/70 bg-black/20 px-4 py-3">
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

          {/* Next milestone */}
          <div className="rounded-2xl border border-slate-800/70 bg-black/20 px-4 py-3">
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

              <span
                className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/25"
                style={{ border: `1px solid rgba(${VAULT_GOLD.rgbSoft} / 0.20)` }}
              >
                <Crown className="h-4 w-4 opacity-90" style={{ color: `rgba(${VAULT_GOLD.rgb} / 0.78)` }} />
              </span>
            </div>

            <div className="mt-3">
              <div className="relative h-2 overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10">
                <div
                  className="absolute inset-0 opacity-[0.45]"
                  style={{
                    background: `
                      radial-gradient(circle_at_20%_50%, rgba(${VAULT_GOLD.rgb} / 0.12), transparent 56%),
                      radial-gradient(circle_at_70%_50%, rgba(59,167,255,0.12), transparent 62%)
                    `,
                  }}
                />
                <div
                  className="absolute left-0 top-0 h-full rounded-full shadow-[0_0_18px_rgba(59,167,255,0.16)]"
                  style={{
                    width: `${Math.round((progressToNext ?? 0) * 100)}%`,
                    background: `linear-gradient(90deg, rgba(${VAULT_GOLD.rgb} / 0.38), rgba(124,200,255,0.66))`,
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-200">{leftMilestoneLabel}</span>
                <span className="font-mono text-slate-200">{rightMilestoneLabel}</span>
              </div>

              <p className="mt-2 text-[11px] text-slate-600">
                Today&apos;s XPOT is fixed at {JACKPOT_XPOT.toLocaleString()} XPOT. Paid in XPOT.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEXT STRIP */}
      <div className="relative z-10 mt-4 rounded-2xl border border-slate-800/70 bg-black/15 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-slate-400">
          <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Context</span>

          {maxJackpotToday != null ? (
            <span>
              Session peak <span className="font-mono text-slate-100">{formatUsd(maxJackpotToday)}</span>
            </span>
          ) : null}

          {range24h ? (
            <span>
              24h <span className="font-mono text-slate-100">{formatUsd(range24h.lowUsd)}</span> -{' '}
              <span className="font-mono text-slate-100">{formatUsd(range24h.highUsd)}</span>
            </span>
          ) : null}

          <span className="text-slate-500">{observedLabel}</span>

          <span className="text-slate-500">
            Source <span className="font-mono text-slate-200">{priceSource}</span>
          </span>
        </div>

        {showUnavailable ? (
          <p className="mt-3 text-[12px] text-amber-200">Live price not available yet - auto-populates when Jupiter is live.</p>
        ) : (
          <p className="mt-3 text-[12px] text-slate-600">
            Updates every {Math.round(PRICE_POLL_MS / 1000)}s. Fallback engages automatically if Jupiter is unavailable.
          </p>
        )}
      </div>
    </section>
  );
}
