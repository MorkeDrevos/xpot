// components/JackpotPanel.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TOKEN_MINT, XPOT_POOL_SIZE } from '@/lib/xpot';

const JACKPOT_XPOT = XPOT_POOL_SIZE;
const PRICE_POLL_MS = 2000; // 2s - feels live without hammering Jupiter

// OHLC refresh (no need to be super live)
const OHLC_POLL_MS = 60_000; // 60s

type JackpotPanelProps = {
  isLocked?: boolean;
  onJackpotUsdChange?: (value: number | null) => void;
  variant?: 'standalone' | 'embedded';

  // Badge in header (eg "10+ year runway")
  badgeLabel?: string;
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

// Milestone ladder for highlights (USD)
const MILESTONES = [
  25, 50, 75, 100,
  150, 200, 300, 400, 500,
  750, 1_000, 1_500, 2_000, 3_000, 4_000, 5_000,
  7_500, 10_000, 15_000, 20_000, 30_000, 40_000, 50_000,
  75_000, 100_000, 150_000, 200_000, 300_000, 400_000, 500_000,
  750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000,
];

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * "Session" key that flips at 22:00 Madrid time (your requirement).
 * DST-safe: we read Madrid hour/date via Intl, then roll date if hour >= cutoff.
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

  // We construct a UTC date from Madrid Y/M/D then "advance day" when needed.
  // We only need a stable session identifier, not an exact timestamp.
  const base = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (hour >= cutoffHour) base.setUTCDate(base.getUTCDate() + 1);

  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, '0');
  const d = String(base.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`; // e.g. 20251204
}

function HeaderBadge({ label, tooltip }: { label: string; tooltip?: string }) {
  if (!label) return null;

  return (
    <div className="relative group inline-flex">
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
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
          "
        >
          <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-slate-950 border-l border-t border-slate-700/80 shadow-[0_4px_10px_rgba(15,23,42,0.8)]" />
          {tooltip}
        </div>
      )}
    </div>
  );
}

type JupiterParsed = {
  priceUsd: number | null;
};

function readJupiter(payload: unknown, mint: string): JupiterParsed {
  if (!payload || typeof payload !== 'object') return { priceUsd: null };
  const p: any = payload;

  // handle common shapes
  const direct = p?.[mint]?.usdPrice;
  const nested = p?.data?.[mint]?.price ?? p?.data?.[mint]?.usdPrice;

  const price =
    (typeof direct === 'number' && Number.isFinite(direct) ? direct : null) ??
    (typeof nested === 'number' && Number.isFinite(nested) ? nested : null);

  return { priceUsd: price };
}

type Ohlc24h = {
  lowUsd: number;
  highUsd: number;
  openUsd?: number;
  closeUsd?: number;
  source: 'birdeye';
};

function getUnixNow() {
  return Math.floor(Date.now() / 1000);
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

  // Soft drift animation for the big USD number
  const [displayJackpotUsd, setDisplayJackpotUsd] = useState<number | null>(null);

  // "pumped" glow + update pulse
  const [justPumped, setJustPumped] = useState(false);
  const pumpTimeout = useRef<number | null>(null);
  const prevJackpot = useRef<number | null>(null);

  const [justUpdated, setJustUpdated] = useState(false);
  const updatePulseTimeout = useRef<number | null>(null);

  // Volatility pulse (based on tick-to-tick price change)
  const [volPulse, setVolPulse] = useState<null | 'up' | 'down'>(null);
  const volPulseTimeout = useRef<number | null>(null);
  const lastPriceUsd = useRef<number | null>(null);

  // Real 24h high/low (USD) from OHLCV
  const [ohlc24h, setOhlc24h] = useState<Ohlc24h | null>(null);
  const [ohlcError, setOhlcError] = useState(false);

  // Session key for "highest this session" (22:00 Madrid cut)
  const sessionKey = useMemo(() => `xpot_max_session_usd_${getMadridSessionKey(22)}`, []);

  // Load max XPOT USD value for *this* session from localStorage
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
        const parsed = readJupiter(json, TOKEN_MINT);
        const price = parsed.priceUsd;

        if (typeof price === 'number' && Number.isFinite(price)) {
          if (aborted) return;

          // Volatility pulse: per-tick move (2s polling)
          if (lastPriceUsd.current != null) {
            const prev = lastPriceUsd.current;
            const deltaPct = prev === 0 ? 0 : ((price - prev) / prev) * 100;

            const THRESH_PCT = 0.6; // tune if you want
            if (Math.abs(deltaPct) >= THRESH_PCT) {
              setVolPulse(deltaPct > 0 ? 'up' : 'down');
              if (volPulseTimeout.current !== null) window.clearTimeout(volPulseTimeout.current);
              volPulseTimeout.current = window.setTimeout(() => setVolPulse(null), 900);
            }
          }
          lastPriceUsd.current = price;

          setPriceUsd(price);

          // tiny pulse when price updates
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

    // Pump flash
    if (prevJackpot.current !== null && jackpotUsd > prevJackpot.current) {
      setJustPumped(true);
      if (pumpTimeout.current !== null) window.clearTimeout(pumpTimeout.current);
      pumpTimeout.current = window.setTimeout(() => setJustPumped(false), 1600);
    }
    prevJackpot.current = jackpotUsd;

    // Store highest XPOT USD value of the current session
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

    // first paint
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

  // Real 24h OHLC high/low from Birdeye
  useEffect(() => {
    let timer: number | null = null;
    let aborted = false;
    const ctrl = new AbortController();

    async function fetchOhlc24h() {
      // Needs a PUBLIC key (client-side). If you prefer server-side, we can move to an internal API route later.
      const key =
        process.env.NEXT_PUBLIC_BIRDEYE_API_KEY ||
        process.env.NEXT_PUBLIC_BIRDEYE_KEY ||
        '';

      if (!key) {
        setOhlc24h(null);
        setOhlcError(false);
        return;
      }

      try {
        setOhlcError(false);

        const now = getUnixNow();
        const from = now - 24 * 60 * 60;

        // Birdeye OHLCV - we request 1h candles for last 24h, then compute high/low.
        // If Birdeye changes params, this will fail gracefully and just hide the band.
        const url =
          `https://public-api.birdeye.so/defi/v3/ohlcv` +
          `?address=${encodeURIComponent(TOKEN_MINT)}` +
          `&type=1H` +
          `&time_from=${from}` +
          `&time_to=${now}`;

        const res = await fetch(url, {
          signal: ctrl.signal,
          cache: 'no-store',
          headers: {
            accept: 'application/json',
            'X-API-KEY': key,
          },
        });

        if (!res.ok) throw new Error(`Birdeye OHLCV failed (${res.status})`);

        const json: any = await res.json();
        if (aborted) return;

        // Try common response shapes
        const items: any[] =
          (Array.isArray(json?.data?.items) ? json.data.items : null) ??
          (Array.isArray(json?.data) ? json.data : null) ??
          (Array.isArray(json?.items) ? json.items : null) ??
          [];

        if (!items.length) {
          setOhlc24h(null);
          return;
        }

        // Each candle commonly: { o, h, l, c, v, unixTime } (naming can vary)
        const highs = items.map(i => Number(i?.h ?? i?.high)).filter(n => Number.isFinite(n));
        const lows = items.map(i => Number(i?.l ?? i?.low)).filter(n => Number.isFinite(n));
        const opens = items.map(i => Number(i?.o ?? i?.open)).filter(n => Number.isFinite(n));
        const closes = items.map(i => Number(i?.c ?? i?.close)).filter(n => Number.isFinite(n));

        if (!highs.length || !lows.length) {
          setOhlc24h(null);
          return;
        }

        const high = Math.max(...highs);
        const low = Math.min(...lows);

        setOhlc24h({
          lowUsd: low * JACKPOT_XPOT,
          highUsd: high * JACKPOT_XPOT,
          openUsd: opens.length ? opens[0] * JACKPOT_XPOT : undefined,
          closeUsd: closes.length ? closes[closes.length - 1] * JACKPOT_XPOT : undefined,
          source: 'birdeye',
        });
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        console.error('[XPOT] Birdeye OHLCV error:', err);
        if (aborted) return;
        setOhlcError(true);
        setOhlc24h(null);
      }
    }

    function onVis() {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') fetchOhlc24h();
    }

    fetchOhlc24h();
    timer = window.setInterval(fetchOhlc24h, OHLC_POLL_MS);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }

    return () => {
      aborted = true;
      ctrl.abort();
      if (timer !== null) window.clearInterval(timer);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Milestones (based on current live XPOT USD value)
  const reachedMilestone =
    jackpotUsd != null ? MILESTONES.filter(m => jackpotUsd >= m).slice(-1)[0] ?? null : null;

  const nextMilestone =
    jackpotUsd != null ? MILESTONES.find(m => jackpotUsd < m) ?? null : null;

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
    displayJackpotUsd === null || !Number.isFinite(displayJackpotUsd)
      ? '—'
      : formatUsd(displayJackpotUsd);

  const panelChrome =
    variant === 'embedded'
      ? 'rounded-2xl border border-slate-800/70 bg-slate-950/55 px-5 py-4 shadow-sm'
      : 'rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 shadow-sm';

  const volGlow =
    volPulse === 'up'
      ? 'shadow-[0_0_40px_rgba(52,211,153,0.28)]'
      : volPulse === 'down'
        ? 'shadow-[0_0_40px_rgba(248,113,113,0.26)]'
        : '';

  const volText =
    volPulse === 'up'
      ? 'text-emerald-100'
      : volPulse === 'down'
        ? 'text-rose-100'
        : '';

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

      {/* HEADER */}
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
          {!!badgeLabel && <HeaderBadge label={badgeLabel} tooltip={badgeTooltip} />}

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
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div
              className={`
                text-5xl sm:text-6xl font-semibold
                tabular-nums
                transition-transform transition-colors duration-200
                ${justUpdated ? 'scale-[1.01]' : ''}
                ${justPumped ? 'text-[#7CC8FF]' : 'text-white'}
                ${volGlow} ${volText}
              `}
            >
              {displayUsdText}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/25 bg-black/40 px-2.5 py-[5px] text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75">
                USD estimate
              </span>

              <div className="relative group">
                <button
                  type="button"
                  aria-label="USD estimate info"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-black/40 text-[10px] font-semibold text-white/70 transition-colors group-hover:text-white"
                >
                  i
                </button>

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
            <span
              className={`
                font-mono transition-colors duration-200
                ${justPumped ? 'text-[#7CC8FF]' : 'text-slate-100'}
              `}
            >
              {priceUsd !== null ? priceUsd.toFixed(8) : '0.00000000'}
            </span>{' '}
            <span className="text-slate-500">(via Jupiter)</span>
          </p>

          {/* Milestone progress bar */}
          {jackpotUsd != null && progressToNext != null && nextMilestone != null && (
            <div className="mt-3 w-full max-w-[520px]">
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-slate-500">
                <span>Milestone progress</span>
                <span className="text-slate-400">{Math.round(progressToNext * 100)}%</span>
              </div>

              <div className="relative h-3 overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10">
                <div className="absolute inset-0 opacity-[0.55] bg-[radial-gradient(circle_at_20%_50%,rgba(124,200,255,0.28),transparent_55%),radial-gradient(circle_at_70%_50%,rgba(59,167,255,0.18),transparent_60%)]" />
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-[linear-gradient(90deg,rgba(59,167,255,0.55),rgba(124,200,255,0.78))] shadow-[0_0_24px_rgba(59,167,255,0.28)]"
                  style={{ width: `${Math.round(progressToNext * 100)}%` }}
                />
                <div
                  className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-white/25 bg-slate-950 shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
                  style={{ left: `calc(${Math.round(progressToNext * 100)}% - 10px)` }}
                >
                  <div className="absolute inset-1 rounded-full bg-[#7CC8FF]/70 blur-[2px]" />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  <span className="text-slate-500">Prev</span>{' '}
                  <span className="font-mono text-slate-100">{formatUsd(prevMilestoneForBar ?? 0)}</span>
                </span>
                <span>
                  <span className="text-slate-500">Next</span>{' '}
                  <span className="font-mono text-slate-100">{formatUsd(nextMilestone)}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 text-xs">
          {(maxJackpotToday || reachedMilestone || nextMilestone || ohlc24h) && (
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
              XPOT price context
            </p>
          )}

          {maxJackpotToday && (
            <p className="text-[11px] text-slate-400">
              Today&apos;s peak value{' '}
              <span className="font-mono text-slate-100">{formatUsd(maxJackpotToday)}</span>
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

          {/* Real 24h High/Low band */}
          {ohlc24h && (
            <div className="mt-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                24h range (high/low)
              </p>
              <p className="mt-1 text-[11px] text-slate-300">
                <span className="text-slate-500">Low</span>{' '}
                <span className="font-mono text-slate-100">{formatUsd(ohlc24h.lowUsd)}</span>
              </p>
              <p className="text-[11px] text-slate-300">
                <span className="text-slate-500">High</span>{' '}
                <span className="font-mono text-slate-100">{formatUsd(ohlc24h.highUsd)}</span>
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Source <span className="font-mono text-slate-300">Birdeye OHLCV</span>
              </p>
            </div>
          )}

          {ohlcError && (
            <p className="mt-2 text-[11px] font-semibold text-amber-300">
              24h range not available.
            </p>
          )}

          {/* Volatility pulse label */}
          {volPulse && (
            <p className={`mt-2 text-[11px] font-semibold ${volPulse === 'up' ? 'text-emerald-300' : 'text-rose-300'}`}>
              Volatility spike {volPulse === 'up' ? 'up' : 'down'}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        Today&apos;s XPOT round is fixed at 1,000,000 XPOT. Its USD value tracks the live on-chain XPOT price from Jupiter and updates automatically.
      </p>
    </section>
  );
}
