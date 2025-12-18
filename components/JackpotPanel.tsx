// components/JackpotPanel.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TOKEN_MINT, XPOT_POOL_SIZE } from '@/lib/xpot';

const JACKPOT_XPOT = XPOT_POOL_SIZE;
const PRICE_POLL_MS = 2000; // 2s

// 24h observed range via rolling samples
const RANGE_SAMPLE_MS = 10_000; // store one sample every 10s
const RANGE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const RANGE_STORAGE_KEY = 'xpot_price_samples_24h_v1';
const RANGE_MAX_SAMPLES = Math.ceil(RANGE_WINDOW_MS / RANGE_SAMPLE_MS) + 120;

// Sparkline window
const SPARK_WINDOW_MS = 6 * 60 * 60 * 1000; // 6h
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
  25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1_000, 1_500, 2_000, 3_000, 4_000, 5_000, 7_500, 10_000, 15_000,
  20_000, 30_000, 40_000, 50_000, 75_000, 100_000, 150_000, 200_000, 300_000, 400_000, 500_000, 750_000, 1_000_000,
  1_500_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000,
];

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
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

function HeaderBadge({ label, tooltip }: { label: string; tooltip?: string }) {
  if (!label) return null;

  return (
    <div className="relative group inline-flex cursor-default select-none">
      <span className="inline-flex cursor-default items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
        {label}
      </span>

      {!!tooltip && (
        <div
          className="
            pointer-events-none absolute left-1/2 top-full z-[80] mt-3 w-[320px] max-w-[80vw]
            -translate-x-1/2
            rounded-2xl border border-slate-700/80 bg-slate-950
            px-4 py-3 text-[12px] leading-relaxed text-slate-100
            shadow-[0_18px_40px_rgba(15,23,42,0.95)] backdrop-blur-xl
            opacity-0 translate-y-0
            group-hover:opacity-100 group-hover:translate-y-1
            transition-all duration-200
            whitespace-pre-line
            cursor-default select-none
          "
        >
          <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-slate-950 border-l border-t border-slate-700/80 shadow-[0_4px_10px_rgba(15,23,42,0.8)]" />
          {tooltip}
        </div>
      )}
    </div>
  );
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

  // Soft drift animation for the big USD number
  const [displayJackpotUsd, setDisplayJackpotUsd] = useState<number | null>(null);

  // Pump glow + update pulse
  const [justPumped, setJustPumped] = useState(false);
  const pumpTimeout = useRef<number | null>(null);
  const prevJackpot = useRef<number | null>(null);

  const [justUpdated, setJustUpdated] = useState(false);
  const updatePulseTimeout = useRef<number | null>(null);

  // Volatility pulse (tick-to-tick)
  const [volPulse, setVolPulse] = useState<null | 'up' | 'down'>(null);
  const volPulseTimeout = useRef<number | null>(null);
  const lastPriceUsd = useRef<number | null>(null);

  // 24h observed range (from rolling samples)
  const samplesRef = useRef<PriceSample[]>([]);
  const lastSampleAtRef = useRef<number>(0);
  const lastPersistAtRef = useRef<number>(0);

  const [range24h, setRange24h] = useState<{ lowUsd: number; highUsd: number } | null>(null);
  const [coverageMs, setCoverageMs] = useState<number>(0);

  // Sparkline (last 6h)
  const [spark, setSpark] = useState<{ points: string; min: number; max: number } | null>(null);

  // Session key for "highest this session" (22:00 Madrid cut)
  const sessionKey = useMemo(() => `xpot_max_session_usd_${getMadridSessionKey(22)}`, []);

  // Load max XPOT USD value for this session from localStorage
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

  // Load rolling samples (for 24h range + sparkline)
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

      const oldest = stored[0].t;
      setCoverageMs(clamp(now - oldest, 0, RANGE_WINDOW_MS));

      const cutoffSpark = now - SPARK_WINDOW_MS;
      const sparkRaw = stored.filter(s => s.t >= cutoffSpark);
      if (sparkRaw.length >= 2) {
        const step = Math.max(1, Math.floor(sparkRaw.length / SPARK_MAX_POINTS));
        const down: PriceSample[] = [];
        for (let i = 0; i < sparkRaw.length; i += step) down.push(sparkRaw[i]);
        if (down[down.length - 1] !== sparkRaw[sparkRaw.length - 1]) down.push(sparkRaw[sparkRaw.length - 1]);

        const built = buildSparklinePoints(down, 220, 26);
        setSpark(built ? { points: built.points, min: built.min, max: built.max } : null);
      }
    }
  }, []);

  // Live price from Jupiter
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

          if (lastPriceUsd.current != null) {
            const prev = lastPriceUsd.current;
            const deltaPct = prev === 0 ? 0 : ((price - prev) / prev) * 100;

            const THRESH_PCT = 0.6;
            if (Math.abs(deltaPct) >= THRESH_PCT) {
              setVolPulse(deltaPct > 0 ? 'up' : 'down');
              if (volPulseTimeout.current !== null) window.clearTimeout(volPulseTimeout.current);
              volPulseTimeout.current = window.setTimeout(() => setVolPulse(null), 900);
            }
          }
          lastPriceUsd.current = price;

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
      if (volPulseTimeout.current !== null) window.clearTimeout(volPulseTimeout.current);

      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, []);

  const jackpotUsd = priceUsd !== null ? JACKPOT_XPOT * priceUsd : null;

  // Track pumps and "highest this session" + notify parent
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

  // Soft USD drift animation for the big number
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (jackpotUsd == null) {
      setDisplayJackpotUsd(null);
      return;
    }

    if (displayJackpotUsd == null) {
      setDisplayJackpotUsd(jackpotUsd);
      return;
    }

    const from = displayJackpotUsd;
    const to = jackpotUsd;

    const delta = Math.abs(to - from);
    if (!Number.isFinite(delta) || delta < 0.01) {
      setDisplayJackpotUsd(to);
      return;
    }

    const DURATION_MS = 650;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = clamp((now - start) / DURATION_MS, 0, 1);
      const eased = easeOutCubic(t);
      setDisplayJackpotUsd(from + (to - from) * eased);
      if (t < 1) raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jackpotUsd]);

  // Update rolling 24h samples + compute observed high/low + coverage + sparkline
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

      if (arr.length >= 2) {
        setCoverageMs(clamp(now - arr[0].t, 0, RANGE_WINDOW_MS));
      } else {
        setCoverageMs(0);
      }

      const cutoffSpark = now - SPARK_WINDOW_MS;
      const sparkRaw = arr.filter(s => s.t >= cutoffSpark);
      if (sparkRaw.length >= 2) {
        const step = Math.max(1, Math.floor(sparkRaw.length / SPARK_MAX_POINTS));
        const down: PriceSample[] = [];
        for (let i = 0; i < sparkRaw.length; i += step) down.push(sparkRaw[i]);
        if (down[down.length - 1] !== sparkRaw[sparkRaw.length - 1]) down.push(sparkRaw[sparkRaw.length - 1]);

        const built = buildSparklinePoints(down, 220, 26);
        setSpark(built ? { points: built.points, min: built.min, max: built.max } : null);
      } else {
        setSpark(null);
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

  const reachedMilestone =
    jackpotUsd != null ? MILESTONES.filter(m => jackpotUsd >= m).slice(-1)[0] ?? null : null;

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
    displayJackpotUsd === null || !Number.isFinite(displayJackpotUsd) ? '—' : formatUsd(displayJackpotUsd);

  const panelChrome =
    variant === 'embedded'
      ? 'rounded-2xl border border-slate-800/70 bg-slate-950/45 px-4 py-4 shadow-sm'
      : 'rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4 shadow-sm';

  const volGlow =
    volPulse === 'up'
      ? 'shadow-[0_0_40px_rgba(52,211,153,0.28)]'
      : volPulse === 'down'
        ? 'shadow-[0_0_40px_rgba(248,113,113,0.26)]'
        : '';

  const volText = volPulse === 'up' ? 'text-emerald-100' : volPulse === 'down' ? 'text-rose-100' : '';

  const observedLabel = coverageMs >= RANGE_WINDOW_MS ? 'Observed: 24h' : `Observed: ${formatCoverage(coverageMs)}`;

  const isWide = layout === 'wide';

  const momentumPct =
    spark && spark.max > spark.min ? (((spark.max - spark.min) / spark.min) * 100).toFixed(2) : '0.00';

  return (
    <section className={`relative transition-colors duration-300 ${panelChrome}`}>
      {/* Soft neon glow on pump */}
      <div
        className={`
          pointer-events-none absolute inset-0 rounded-2xl
          border border-[#3BA7FF]/35
          shadow-[0_0_44px_rgba(59,167,255,0.42)]
          opacity-0 transition-opacity duration-500
          ${justPumped ? 'opacity-100' : ''}
        `}
      />

      {/* ENGINE SLAB HEADER */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex rounded-full bg-[rgba(59,167,255,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7CC8FF]">
            Today&apos;s XPOT
          </span>

          <span className="inline-flex items-baseline rounded-xl bg-black/40 px-3.5 py-2 font-mono text-[15px] tracking-[0.14em] text-slate-100 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
            {poolLabel}
          </span>

          <span className="hidden sm:inline-flex items-center gap-2 text-[11px] text-slate-500">
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="text-slate-400">via Jupiter</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!!badgeLabel && <HeaderBadge label={badgeLabel} tooltip={badgeTooltip} />}

          {isLocked && (
            <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200">
              Draw locked
            </span>
          )}

          <span
            className={[
              'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
              showUnavailable ? 'border-amber-400/35 bg-amber-500/10 text-amber-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
            ].join(' ')}
          >
            {showUnavailable ? 'Price pending' : 'Live'}
          </span>
        </div>
      </div>

      {/* SLAB BODY */}
      <div className="relative z-10 mt-4 grid gap-3">
        <div className={isWide ? 'grid gap-3 lg:grid-cols-[1.3fr_0.7fr]' : 'grid gap-3'}>
          {/* LEFT: Big number + micro context */}
          <div className="min-w-0 rounded-2xl border border-white/10 bg-black/22 px-4 py-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div
                className={`
                  text-4xl sm:text-5xl font-semibold tabular-nums
                  transition-transform transition-colors duration-200
                  ${justUpdated ? 'scale-[1.01]' : ''}
                  ${justPumped ? 'text-[#7CC8FF]' : 'text-white'}
                  ${volGlow} ${volText}
                `}
              >
                {displayUsdText}
              </div>

              <div className="flex flex-col items-end gap-1 text-[11px] text-slate-400">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">USD value</span>
                <span className="font-mono text-slate-200">
                  1 XPOT ≈ {priceUsd !== null ? priceUsd.toFixed(8) : '0.00000000'}
                </span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>Auto-updates from Jupiter ticks</span>
              <span className="font-mono text-slate-600">{observedLabel}</span>
            </div>
          </div>

          {/* RIGHT: Signals (compact) */}
          <div className="min-w-0 grid gap-3">
            {/* Momentum */}
            <div className="rounded-2xl border border-white/10 bg-black/22 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Momentum</span>
                <span className="font-mono text-[11px] text-slate-300">{momentumPct}%</span>
              </div>

              <div className="mt-2">
                {spark ? (
                  <>
                    <svg width="100%" height="30" viewBox="0 0 220 26" className="block text-slate-400" aria-label="XPOT mini sparkline (observed)">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={spark.points}
                        opacity="0.9"
                      />
                    </svg>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-mono">min {spark.min.toFixed(8)}</span>
                      <span className="font-mono">max {spark.max.toFixed(8)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-500">Collecting ticks…</p>
                )}
              </div>
            </div>

            {/* Milestone */}
            <div className="rounded-2xl border border-white/10 bg-black/22 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Milestone</span>
                <span className="font-mono text-[11px] text-slate-300">
                  {jackpotUsd != null && progressToNext != null ? `${Math.round(progressToNext * 100)}%` : '—'}
                </span>
              </div>

              <div className="mt-2 relative h-2.5 overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10">
                <div className="absolute inset-0 opacity-[0.55] bg-[radial-gradient(circle_at_20%_50%,rgba(124,200,255,0.26),transparent_55%),radial-gradient(circle_at_70%_50%,rgba(59,167,255,0.16),transparent_60%)]" />
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-[linear-gradient(90deg,rgba(59,167,255,0.55),rgba(124,200,255,0.78))] shadow-[0_0_24px_rgba(59,167,255,0.22)]"
                  style={{ width: `${Math.round((progressToNext ?? 0) * 100)}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-slate-100">{formatUsd(prevMilestoneForBar ?? 0)}</span>
                <span className="font-mono text-slate-100">{nextMilestone ? formatUsd(nextMilestone) : '—'}</span>
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-mono text-slate-500">{reachedMilestone ? `Hit ${formatUsd(reachedMilestone)}` : ''}</span>
                {volPulse ? (
                  <span className={`font-semibold ${volPulse === 'up' ? 'text-emerald-300' : 'text-rose-300'}`}>
                    Vol spike {volPulse === 'up' ? 'up' : 'down'}
                  </span>
                ) : (
                  <span />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM STRIP: Context + range collapsed */}
        <div className="rounded-2xl border border-white/10 bg-black/22 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
              <span className="text-slate-500 uppercase tracking-[0.16em] text-[10px] font-semibold">Context</span>

              <span>
                Session peak{' '}
                <span className="font-mono text-slate-100">{maxJackpotToday != null ? formatUsd(maxJackpotToday) : '—'}</span>
              </span>

              <span className="text-slate-600">•</span>

              <span>
                24h{' '}
                <span className="font-mono text-slate-100">
                  {range24h ? `${formatUsd(range24h.lowUsd)} - ${formatUsd(range24h.highUsd)}` : '—'}
                </span>
              </span>

              <span className="text-slate-600">•</span>

              <span className="font-mono text-slate-500">{observedLabel}</span>

              <span className="text-slate-600">•</span>

              <span className="text-slate-500">
                Source <span className="font-mono text-slate-300">Jupiter ticks</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-500">
              {showUnavailable ? (
                <span className="text-amber-200/90">Live price not available yet - auto-populates when Jupiter is live.</span>
              ) : (
                <span className="text-slate-500">Paid in XPOT. USD is display only.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
