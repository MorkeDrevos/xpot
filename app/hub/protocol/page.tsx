// app/hub/protocol/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ChartNoAxesCombined,
  Crown,
  ShieldCheck,
  Sparkles,
  Timer,
  Ticket,
  Waves,
  Zap,
  ExternalLink,
  Info,
  Copy,
  Check,
  RefreshCw,
  Wifi,
  WifiOff,
  Gauge,
} from 'lucide-react';

import XpotPageShell from '@/components/XpotPageShell';
import { TOKEN_MINT } from '@/lib/xpot';

type LiveDraw = {
  jackpotXpot: number; // API field name (keep), UI avoids "jackpot"
  jackpotUsd?: number; // legacy/stub only - UI should not rely on it
  closesAt: string; // ISO
  status: 'OPEN' | 'LOCKED' | 'DRAWING' | 'COMPLETED';
};

type BonusXPOT = {
  id: string;
  label?: string;
  amountXpot: number;
  scheduledAt: string; // ISO
  status: 'UPCOMING' | 'CLAIMED' | 'CANCELLED';
};

type ProtocolState = {
  lpUsd?: number;
  lpChange24hPct?: number;
  liquiditySignal?: 'HEALTHY' | 'WATCH' | 'CRITICAL';
  priceUsd?: number;
  volume24hUsd?: number;
  updatedAt?: string; // ISO
  source?: 'dexscreener';
  pairUrl?: string;
  pairAddress?: string;
  chainId?: string;
  dexId?: string;
};

type PillTone = 'slate' | 'emerald' | 'amber' | 'sky';

const LIVE_REFRESH_MS = 15_000;
const PROTO_REFRESH_MS = 20_000;

// Client-side sampling (no backend changes)
type Sample = { t: number; v: number };
const SAMPLE_MAX = 180; // ~60 min if sampling ~20s
const KEY_PRICE = 'xpot_protocol_samples_price_v1';
const KEY_LP = 'xpot_protocol_samples_lp_v1';
const KEY_VOL = 'xpot_protocol_samples_vol_v1';

function StatusPill({
  children,
  tone = 'slate',
  className = '',
}: {
  children: React.ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20'
      : tone === 'amber'
      ? 'bg-amber-500/10 text-amber-300 border-amber-400/20'
      : tone === 'sky'
      ? 'bg-sky-500/10 text-sky-300 border-sky-400/20'
      : 'bg-slate-800/60 text-slate-200 border-white/10';

  return (
    <span
      className={`
        inline-flex items-center gap-2
        rounded-full border px-3 py-1
        text-[10px] font-semibold uppercase tracking-[0.18em]
        ${cls} ${className}
      `}
    >
      {children}
    </span>
  );
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatCountdown(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function fmtUsdCompact(n?: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtUsd(n?: number, digits = 6) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `$${v.toFixed(digits)}`;
}

function fmtPct(n?: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

function toneFromSignal(sig?: ProtocolState['liquiditySignal']): PillTone {
  if (sig === 'HEALTHY') return 'emerald';
  if (sig === 'WATCH') return 'amber';
  if (sig === 'CRITICAL') return 'slate';
  return 'sky';
}

function labelFromSignal(sig?: ProtocolState['liquiditySignal']) {
  if (sig === 'HEALTHY') return 'Healthy';
  if (sig === 'WATCH') return 'Watch';
  if (sig === 'CRITICAL') return 'Critical';
  return 'Unknown';
}

function isPairPending(p?: ProtocolState | null) {
  if (!p) return true;
  const hasAny =
    Number.isFinite(Number(p.priceUsd)) ||
    Number.isFinite(Number(p.lpUsd)) ||
    Number.isFinite(Number(p.volume24hUsd));
  return !hasAny;
}

function formatMadridTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(d);
}

function shortAddr(a: string) {
  if (!a) return '—';
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function loadSamples(key: string): Sample[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const j = JSON.parse(raw);
    if (!Array.isArray(j)) return [];
    return j
      .map((x: any) => ({ t: Number(x?.t), v: Number(x?.v) }))
      .filter(s => Number.isFinite(s.t) && Number.isFinite(s.v));
  } catch {
    return [];
  }
}

function saveSamples(key: string, arr: Sample[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(arr.slice(-SAMPLE_MAX)));
  } catch {
    // no-op
  }
}

function pushSample(key: string, v?: number) {
  const num = Number(v);
  if (!Number.isFinite(num)) return;

  const now = Date.now();
  const arr = loadSamples(key);

  // avoid noisy duplicates: only push if last is older than ~6s or value changed meaningfully
  const last = arr[arr.length - 1];
  if (last && now - last.t < 6000 && Math.abs(last.v - num) < 1e-12) return;

  const next = [...arr, { t: now, v: num }].slice(-SAMPLE_MAX);
  saveSamples(key, next);
}

function Sparkline({
  samples,
  height = 40,
}: {
  samples: Sample[];
  height?: number;
}) {
  const width = 240;

  const points = useMemo(() => {
    if (!samples || samples.length < 2) return '';

    const vs = samples.map(s => s.v);
    const min = Math.min(...vs);
    const max = Math.max(...vs);

    const span = max - min || 1;

    const xs = samples.map((_, i) => (i / (samples.length - 1)) * (width - 8) + 4);
    const ys = samples.map(s => {
      const y01 = (s.v - min) / span;
      const y = (1 - clamp01(y01)) * (height - 10) + 5;
      return y;
    });

    return xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  }, [samples, height]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-[40px] w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="xpotSpark" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(56,189,248,0.60)" />
            <stop offset="50%" stopColor="rgba(52,211,153,0.60)" />
            <stop offset="100%" stopColor="rgba(217,70,239,0.55)" />
          </linearGradient>
        </defs>

        <path
          d={
            points
              ? `M ${points.replaceAll(' ', ' L ')}`
              : ''
          }
          fill="none"
          stroke="url(#xpotSpark)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={points ? 0.9 : 0}
        />

        <path
          d={
            points
              ? `M ${points.replaceAll(' ', ' L ')} L ${width - 4},${height - 5} L 4,${height - 5} Z`
              : ''
          }
          fill="url(#xpotSpark)"
          opacity={points ? 0.08 : 0}
        />
      </svg>

      {!points ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Awaiting samples
          </span>
        </div>
      ) : null}
    </div>
  );
}

function XpotAmount({ amount }: { amount: number }) {
  const n = Number(amount);
  const text = Number.isFinite(n) ? n.toLocaleString() : '—';
  return (
    <span className="inline-flex items-baseline gap-3">
      <span className="font-mono text-amber-200 tracking-[0.18em] text-lg sm:text-xl">
        {text}
      </span>
      <span className="text-slate-400 font-semibold tracking-[0.14em]">XPOT</span>
    </span>
  );
}

function tickNumber(prev: string, next: string, ms = 240) {
  // micro “alive” tick: briefly fade/scale when value changes
  // (handled by CSS class toggle; logic lives in component)
  return { prev, next, ms };
}

export default function HubProtocolPage() {
  const reduceMotion = useReducedMotion();

  const [draw, setDraw] = useState<LiveDraw | null>(null);
  const [bonus, setBonus] = useState<BonusXPOT[]>([]);
  const [proto, setProto] = useState<ProtocolState | null>(null);

  const [loading, setLoading] = useState(true);
  const [protoLoading, setProtoLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [protoError, setProtoError] = useState<string | null>(null);

  const [now, setNow] = useState(() => Date.now());

  const [copied, setCopied] = useState(false);

  // Refresh telemetry
  const [liveNextAt, setLiveNextAt] = useState(() => Date.now() + LIVE_REFRESH_MS);
  const [protoNextAt, setProtoNextAt] = useState(() => Date.now() + PROTO_REFRESH_MS);
  const [liveLatencyMs, setLiveLatencyMs] = useState<number | null>(null);
  const [protoLatencyMs, setProtoLatencyMs] = useState<number | null>(null);

  // Avoid state updates after unmount and avoid out-of-order responses
  const liveReqId = useRef(0);
  const protoReqId = useRef(0);

  // “tick” animation keys for numbers
  const [lpKey, setLpKey] = useState(0);
  const [pxKey, setPxKey] = useState(0);
  const [volKey, setVolKey] = useState(0);

  // Load sparklines from storage
  const [priceSamples, setPriceSamples] = useState<Sample[]>([]);
  const [lpSamples, setLpSamples] = useState<Sample[]>([]);
  const [volSamples, setVolSamples] = useState<Sample[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // initial sample load
    try {
      setPriceSamples(loadSamples(KEY_PRICE));
      setLpSamples(loadSamples(KEY_LP));
      setVolSamples(loadSamples(KEY_VOL));
    } catch {
      // no-op
    }
  }, []);

  function refreshLocalSamples() {
    setPriceSamples(loadSamples(KEY_PRICE));
    setLpSamples(loadSamples(KEY_LP));
    setVolSamples(loadSamples(KEY_VOL));
  }

  async function loadLive() {
    const req = ++liveReqId.current;

    try {
      setError(null);

      const ac = new AbortController();
      const t = window.setTimeout(() => ac.abort(), 5500);

      const t0 = performance.now();
      const [dRes, bRes] = await Promise.all([
        fetch('/api/draw/live', { cache: 'no-store', signal: ac.signal }),
        fetch('/api/bonus/live', { cache: 'no-store', signal: ac.signal }),
      ]).finally(() => window.clearTimeout(t));
      const t1 = performance.now();

      if (req !== liveReqId.current) return;

      setLiveLatencyMs(Math.round(t1 - t0));

      const d = await dRes.json().catch(() => ({}));
      const b = await bRes.json().catch(() => ({}));

      if (req !== liveReqId.current) return;

      setDraw(d?.draw ?? null);
      setBonus(Array.isArray(b?.bonus) ? b.bonus : []);
    } catch {
      setError('Failed to load live data. Please refresh.');
    } finally {
      setLoading(false);
      setLiveNextAt(Date.now() + LIVE_REFRESH_MS);
    }
  }

  async function loadProto() {
    const req = ++protoReqId.current;

    try {
      setProtoError(null);

      const ac = new AbortController();
      const t = window.setTimeout(() => ac.abort(), 5500);

      const t0 = performance.now();
      const res = await fetch('/api/protocol/state', {
        cache: 'no-store',
        signal: ac.signal,
      }).finally(() => window.clearTimeout(t));
      const t1 = performance.now();

      if (req !== protoReqId.current) return;

      setProtoLatencyMs(Math.round(t1 - t0));

      if (!res.ok) {
        setProto(null);
        return;
      }

      const j = await res.json().catch(() => ({}));
      const next = (j?.state ?? j ?? null) as ProtocolState | null;

      // sample for sparklines
      if (next) {
        pushSample(KEY_PRICE, next.priceUsd);
        pushSample(KEY_LP, next.lpUsd);
        pushSample(KEY_VOL, next.volume24hUsd);
        refreshLocalSamples();
      }

      setProto(prev => {
        // trigger subtle tick if value changed
        const prevLp = Number(prev?.lpUsd);
        const prevPx = Number(prev?.priceUsd);
        const prevVol = Number(prev?.volume24hUsd);

        const nextLp = Number(next?.lpUsd);
        const nextPx = Number(next?.priceUsd);
        const nextVol = Number(next?.volume24hUsd);

        if (Number.isFinite(prevLp) && Number.isFinite(nextLp) && prevLp !== nextLp) setLpKey(k => k + 1);
        if (Number.isFinite(prevPx) && Number.isFinite(nextPx) && prevPx !== nextPx) setPxKey(k => k + 1);
        if (Number.isFinite(prevVol) && Number.isFinite(nextVol) && prevVol !== nextVol) setVolKey(k => k + 1);

        return next;
      });
    } catch {
      setProtoError('Protocol metrics unavailable.');
      setProto(null);
    } finally {
      setProtoLoading(false);
      setProtoNextAt(Date.now() + PROTO_REFRESH_MS);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      await loadLive();
      if (!alive) return;
      await loadProto();
    })();

    const liveT = window.setInterval(() => {
      if (!alive) return;
      loadLive();
    }, LIVE_REFRESH_MS);

    const protoT = window.setInterval(() => {
      if (!alive) return;
      loadProto();
    }, PROTO_REFRESH_MS);

    return () => {
      alive = false;
      window.clearInterval(liveT);
      window.clearInterval(protoT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liveIsOpen = draw?.status === 'OPEN';

  // Single source of truth: draw.closesAt from DB-backed /api/draw/live
  const closesIn = useMemo(() => {
    if (!draw?.closesAt) return '00:00:00';
    const target = new Date(draw.closesAt).getTime();
    return formatCountdown(target - now);
  }, [draw?.closesAt, now]);

  const pendingPair = useMemo(() => isPairPending(proto), [proto]);

  // USD estimate: derived from live token price (proto.priceUsd) * daily amount
  const dailyUsdEstimate = useMemo(() => {
    const amt = Number(draw?.jackpotXpot);
    const px = Number(proto?.priceUsd);
    if (Number.isFinite(amt) && Number.isFinite(px)) return amt * px;
    return undefined;
  }, [draw?.jackpotXpot, proto?.priceUsd]);

  const liveRefreshIn = useMemo(() => Math.max(0, liveNextAt - now), [liveNextAt, now]);
  const protoRefreshIn = useMemo(() => Math.max(0, protoNextAt - now), [protoNextAt, now]);

  const connectionTone = useMemo<PillTone>(() => {
    const lat = Math.max(Number(liveLatencyMs ?? 0), Number(protoLatencyMs ?? 0));
    if (!Number.isFinite(lat) || lat <= 0) return 'sky';
    if (lat < 450) return 'emerald';
    if (lat < 1200) return 'amber';
    return 'slate';
  }, [liveLatencyMs, protoLatencyMs]);

  const connectionLabel = useMemo(() => {
    const lat = Math.max(Number(liveLatencyMs ?? 0), Number(protoLatencyMs ?? 0));
    if (!Number.isFinite(lat) || lat <= 0) return 'Telemetry';
    if (lat < 450) return 'Fast link';
    if (lat < 1200) return 'Stable link';
    return 'Degraded link';
  }, [liveLatencyMs, protoLatencyMs]);

  async function copyCA() {
    try {
      await navigator.clipboard.writeText(TOKEN_MINT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // no-op
    }
  }

  async function manualRefresh() {
    setLoading(true);
    setProtoLoading(true);
    await Promise.allSettled([loadLive(), loadProto()]);
  }

  return (
    <XpotPageShell
      title="Protocol State"
      subtitle="Live protocol integrity, liquidity conditions, and execution signals."
      pageTag="hub"
      topBarProps={{ liveIsOpen }}
      headerClassName="bg-white/[0.015]"
    >
      <style>{`
        .xpot-protocol-scan::before{
          content:"";
          pointer-events:none;
          position:absolute;
          inset:-2px;
          border-radius: 40px;
          background: linear-gradient(to bottom,
            transparent,
            rgba(16,185,129,0.10),
            rgba(56,189,248,0.07),
            transparent
          );
          opacity: 0;
          transform: translateY(-18%);
          animation: xpotScan 6.2s ease-in-out infinite;
          mix-blend-mode: screen;
        }
        @keyframes xpotScan{
          0%{ opacity:0; transform: translateY(-18%); }
          18%{ opacity:0.9; }
          50%{ opacity:0.2; }
          82%{ opacity:0.9; }
          100%{ opacity:0; transform: translateY(18%); }
        }
        .xpot-live-pulse{
          position: relative;
        }
        .xpot-live-pulse::after{
          content:"";
          position:absolute;
          inset:-1px;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 20%, rgba(52,211,153,0.18), transparent 55%),
                      radial-gradient(circle at 70% 80%, rgba(56,189,248,0.16), transparent 60%),
                      radial-gradient(circle at 50% 50%, rgba(217,70,239,0.10), transparent 60%);
          opacity: 0.65;
          filter: blur(10px);
          animation: xpotPulse 2.8s ease-in-out infinite;
          pointer-events:none;
        }
        @keyframes xpotPulse{
          0%,100%{ transform: scale(1); opacity:0.55; }
          50%{ transform: scale(1.03); opacity:0.80; }
        }
        .xpot-tick{
          animation: xpotTick 260ms ease-out;
        }
        @keyframes xpotTick{
          0%{ transform: translateY(0); filter: brightness(1); }
          35%{ transform: translateY(-1px); filter: brightness(1.12); }
          100%{ transform: translateY(0); filter: brightness(1); }
        }
      `}</style>

      <section className="mt-2 space-y-6">
        {/* TOP STRIP */}
        <motion.section
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.02] px-6 py-6 backdrop-blur-xl xpot-protocol-scan"
        >
          <div className="pointer-events-none absolute -top-36 left-16 h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Integrity overview
              </p>
              <p className="mt-2 text-sm text-slate-200/90">
                A calm, real-time view of liquidity and execution - designed for trust, not hype.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-300" />
                  Official CA:{' '}
                  <span className="text-slate-200/80">{shortAddr(TOKEN_MINT)}</span>
                </span>

                <button
                  onClick={copyCA}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200/80 hover:text-slate-100 hover:bg-white/[0.06] transition"
                  type="button"
                  aria-label="Copy contract address"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>

                {proto?.pairUrl ? (
                  <>
                    <span className="inline-flex items-center gap-2">
                      <Info className="h-4 w-4 text-slate-300" />
                      Source: {proto.source || 'unknown'}
                    </span>
                    <Link
                      href={proto.pairUrl}
                      target="_blank"
                      className="inline-flex items-center gap-2 text-slate-200/80 hover:text-slate-100 transition"
                    >
                      View pair <ExternalLink className="h-4 w-4" />
                    </Link>
                  </>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusPill tone={connectionTone}>
                  <Gauge className="h-3.5 w-3.5" />
                  {connectionLabel}
                  <span className="text-slate-300/80">
                    {typeof liveLatencyMs === 'number' || typeof protoLatencyMs === 'number'
                      ? `${Math.max(liveLatencyMs ?? 0, protoLatencyMs ?? 0)}ms`
                      : ''}
                  </span>
                </StatusPill>

                <StatusPill tone="sky">
                  <Timer className="h-3.5 w-3.5" />
                  Refresh:{' '}
                  <span className="text-slate-200/80">
                    live {Math.ceil(liveRefreshIn / 1000)}s
                  </span>
                  <span className="text-slate-500">/</span>
                  <span className="text-slate-200/80">
                    protocol {Math.ceil(protoRefreshIn / 1000)}s
                  </span>
                </StatusPill>

                <button
                  onClick={manualRefresh}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200/80 hover:text-slate-100 hover:bg-white/[0.06] transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh now
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={liveIsOpen ? 'emerald' : 'slate'} className={liveIsOpen ? 'xpot-live-pulse' : ''}>
                <Sparkles className="h-3.5 w-3.5" />
                {liveIsOpen ? 'Live entries' : 'Standby'}
              </StatusPill>

              <StatusPill tone={toneFromSignal(proto?.liquiditySignal)}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Liquidity: {labelFromSignal(proto?.liquiditySignal)}
              </StatusPill>

              <StatusPill tone="sky">
                <Activity className="h-3.5 w-3.5" />
                {proto?.updatedAt
                  ? `Updated ${formatMadridTime(proto.updatedAt)} (Madrid)`
                  : 'Live'}
              </StatusPill>

              <StatusPill tone={protoError ? 'amber' : 'emerald'}>
                {protoError ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
                {protoError ? 'Limited' : 'Connected'}
              </StatusPill>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="LP (USD)"
              value={protoLoading ? 'Loading…' : fmtUsdCompact(proto?.lpUsd)}
              hint={protoLoading ? '' : pendingPair ? 'Pending first LP' : 'Total liquidity value'}
              icon={<Waves className="h-4 w-4 text-sky-300" />}
              pulseKey={lpKey}
              spark={<Sparkline samples={lpSamples} />}
            />
            <MetricCard
              label="LP change (24h)"
              value={protoLoading ? 'Loading…' : fmtPct(proto?.lpChange24hPct)}
              hint={protoLoading ? '' : 'Stability band next'}
              icon={<ChartNoAxesCombined className="h-4 w-4 text-fuchsia-300" />}
            />
            <MetricCard
              label="Price (USD)"
              value={protoLoading ? 'Loading…' : fmtUsd(proto?.priceUsd, 6)}
              hint={protoLoading ? '' : pendingPair ? 'Pending market' : 'Reference price'}
              icon={<Activity className="h-4 w-4 text-emerald-300" />}
              pulseKey={pxKey}
              spark={<Sparkline samples={priceSamples} />}
            />
            <MetricCard
              label="Volume (24h)"
              value={protoLoading ? 'Loading…' : fmtUsdCompact(proto?.volume24hUsd)}
              hint={protoLoading ? '' : pendingPair ? 'No trades yet' : 'Observed volume'}
              icon={<Zap className="h-4 w-4 text-amber-300" />}
              pulseKey={volKey}
              spark={<Sparkline samples={volSamples} />}
            />
          </div>

          {protoError ? <p className="mt-4 text-sm text-amber-300">{protoError}</p> : null}

          {!protoLoading && pendingPair ? (
            <div className="mt-5 rounded-3xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-400/20 bg-white/[0.03]">
                  <Info className="h-5 w-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                    Market pending
                  </p>
                  <p className="mt-1 text-sm text-slate-200/85">
                    XPOT is not trading yet or the first liquidity pool is not indexed publicly. This panel will auto-populate once an LP exists.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Nothing to do here - it goes live automatically.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </motion.section>

        {/* MAIN XPOT */}
        <motion.section
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.02] px-6 py-6 backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">Main XPOT</p>
                <p className="mt-1 text-xs text-slate-400">Today’s primary draw</p>
              </div>

              <StatusPill tone={liveIsOpen ? 'emerald' : 'slate'} className={liveIsOpen ? 'xpot-live-pulse' : ''}>
                <Sparkles className="h-3.5 w-3.5" />
                {liveIsOpen ? 'LIVE' : 'STANDBY'}
              </StatusPill>
            </div>

            {error ? (
              <p className="mt-6 text-sm text-amber-300">{error}</p>
            ) : loading || !draw ? (
              <p className="mt-6 text-sm text-slate-400">Loading live draw…</p>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Daily reward"
                  valueNode={<XpotAmount amount={Number(draw.jackpotXpot ?? 0)} />}
                  hint={
                    Number.isFinite(Number(dailyUsdEstimate))
                      ? `≈ ${fmtUsdCompact(dailyUsdEstimate)}`
                      : '—'
                  }
                  icon={<Crown className="h-4 w-4 text-amber-300" />}
                />
                <MetricCard
                  label="Closes in"
                  value={closesIn}
                  hint={draw.closesAt ? `Closes at ${formatMadridTime(draw.closesAt)} (Madrid)` : ''}
                  icon={<Timer className="h-4 w-4 text-sky-300" />}
                />
                <MetricCard
                  label="Status"
                  value={draw.status}
                  hint={
                    draw.status === 'OPEN'
                      ? 'Entries are active'
                      : draw.status === 'LOCKED'
                      ? 'Entry window closed'
                      : draw.status === 'DRAWING'
                      ? 'Picking winner'
                      : 'Completed'
                  }
                  icon={<Sparkles className="h-4 w-4 text-emerald-300" />}
                />
              </div>
            )}
          </div>
        </motion.section>

        {/* BONUS XPOTS */}
        <section className="rounded-[36px] border border-white/10 bg-white/[0.02] px-6 py-6 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-100">Bonus XPOTs</p>
              <p className="mt-1 text-xs text-slate-400">Extra reward drops today</p>
            </div>

            <Zap className="h-5 w-5 text-amber-300" />
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400">Loading bonus XPOTs…</p>
            ) : bonus.length === 0 ? (
              <p className="text-sm text-slate-500">No bonus XPOTs scheduled.</p>
            ) : (
              bonus.map(b => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100">
                      <XpotAmount amount={Number(b.amountXpot ?? 0)} />
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatMadridTime(b.scheduledAt)} (Madrid)
                      {b.label ? <span className="text-slate-500"> - {b.label}</span> : null}
                    </p>
                  </div>

                  <StatusPill
                    tone={
                      b.status === 'CLAIMED'
                        ? 'emerald'
                        : b.status === 'CANCELLED'
                        ? 'slate'
                        : 'amber'
                    }
                  >
                    {b.status === 'CLAIMED' ? (
                      <>
                        <Crown className="h-3.5 w-3.5" />
                        Claimed
                      </>
                    ) : b.status === 'CANCELLED' ? (
                      <>
                        <Info className="h-3.5 w-3.5" />
                        Cancelled
                      </>
                    ) : (
                      <>
                        <Ticket className="h-3.5 w-3.5" />
                        Upcoming
                      </>
                    )}
                  </StatusPill>
                </div>
              ))
            )}
          </div>
        </section>

        {/* LIVE MARKET PANELS */}
        <section className="grid gap-6 lg:grid-cols-2">
          <PremiumPanel
            title="Liquidity"
            subtitle="LP integrity and stability signals."
            icon={<Waves className="h-5 w-5 text-sky-300" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <SoftKpi label="Total LP" value={protoLoading ? 'Loading…' : fmtUsdCompact(proto?.lpUsd)} />
              <SoftKpi label="24h change" value={protoLoading ? 'Loading…' : fmtPct(proto?.lpChange24hPct)} />
            </div>

            <div className="mt-5">
              <GraphBlock
                title="LP micro-trend"
                badge="Live"
                spark={<Sparkline samples={lpSamples} height={44} />}
                note="Client-side sampled. Server-side 24h history can land next for a true banded stability chart."
              />
            </div>
          </PremiumPanel>

          <PremiumPanel
            title="Market"
            subtitle="Reference price and volume behaviour."
            icon={<Activity className="h-5 w-5 text-emerald-300" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <SoftKpi label="Price" value={protoLoading ? 'Loading…' : fmtUsd(proto?.priceUsd, 6)} />
              <SoftKpi label="Volume (24h)" value={protoLoading ? 'Loading…' : fmtUsdCompact(proto?.volume24hUsd)} />
            </div>

            <div className="mt-5 space-y-3">
              <GraphBlock
                title="Price micro-trend"
                badge="Live"
                spark={<Sparkline samples={priceSamples} height={44} />}
                note="Client-side sampled. Shows movement once trading starts."
              />
              <GraphBlock
                title="Volume micro-trend"
                badge="Live"
                spark={<Sparkline samples={volSamples} height={44} />}
                note="Client-side sampled. Useful for spotting early liquidity and first bursts."
              />
            </div>
          </PremiumPanel>
        </section>
      </section>
    </XpotPageShell>
  );
}

function MetricCard({
  label,
  value,
  valueNode,
  hint,
  icon,
  pulseKey,
  spark,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  pulseKey?: number;
  spark?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
        {icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
            {icon}
          </span>
        ) : null}
      </div>

      <div className="mt-2">
        {valueNode ? (
          <div className="text-slate-100">{valueNode}</div>
        ) : (
          <p key={pulseKey ?? 0} className="text-lg font-semibold text-slate-100 xpot-tick">
            {value ?? '—'}
          </p>
        )}
      </div>

      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}

      {spark ? <div className="mt-3">{spark}</div> : null}
    </div>
  );
}

function PremiumPanel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.02] px-6 py-6 backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-28 right-0 h-[420px] w-[420px] rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-[420px] w-[420px] rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-100">{title}</p>
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          </div>
          {icon ? (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
              {icon}
            </span>
          ) : null}
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function SoftKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function GraphBlock({
  title,
  badge,
  spark,
  note,
}: {
  title: string;
  badge: string;
  spark: React.ReactNode;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-200">{title}</p>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          <ChartNoAxesCombined className="h-3.5 w-3.5 text-slate-200" />
          {badge}
        </span>
      </div>

      <div className="mt-3">{spark}</div>

      <p className="mt-3 text-xs text-slate-400">{note}</p>
    </div>
  );
}
