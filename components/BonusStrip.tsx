// components/BonusStrip.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Activity, Sparkles, Zap } from 'lucide-react';

type BonusInfo = {
  id: string;
  label: string;
  amountXpot: number;
  scheduledAt: string; // ISO
  status?: string;
};

type BonusStripVariant = 'home' | 'hub' | 'ops';

type BonusStripProps = {
  variant?: BonusStripVariant;
};

const ENDPOINT = '/api/bonus/upcoming';

// Polling (tuned to feel “live” without hammering)
const POLL_IDLE_MS = 20000; // when no bonus exists yet (so it can appear without refresh)
const POLL_CALM_MS = 45000; // bonus exists but far away
const POLL_HOT_MS = 15000; // <= 30 min
const POLL_CRITICAL_MS = 5000; // <= 5 min
const FIRE_REFETCH_DELAY_MS = 3500; // after hitting 0, allow backend to flip state

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

function diffMs(targetIso: string) {
  const now = Date.now();
  const target = new Date(targetIso).getTime();
  return target - now;
}

function formatHms(ms: number) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function BonusStrip({ variant = 'home' }: BonusStripProps) {
  const [bonus, setBonus] = useState<BonusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  const inFlight = useRef<AbortController | null>(null);
  const pollTimer = useRef<number | null>(null);
  const tickTimer = useRef<number | null>(null);
  const fireTimer = useRef<number | null>(null);

  async function loadBonus(reason: 'mount' | 'poll' | 'visible' | 'fired' = 'poll') {
    try {
      setError(null);

      // abort any existing in-flight request
      if (inFlight.current) inFlight.current.abort();
      const ac = new AbortController();
      inFlight.current = ac;

      const res = await fetch(ENDPOINT, { cache: 'no-store', signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data?.bonus) {
        const b: BonusInfo = {
          id: String(data.bonus.id),
          label: String(data.bonus.label ?? 'Bonus XPOT'),
          amountXpot: Number(data.bonus.amountXpot ?? 0),
          scheduledAt: String(data.bonus.scheduledAt),
          status: data.bonus.status ? String(data.bonus.status) : undefined,
        };
        setBonus(b);
      } else {
        setBonus(null);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error('[BonusStrip] loadBonus failed', reason, e);
      setError('FAILED_TO_LOAD');
      // keep UI clean
      setBonus(null);
    } finally {
      setLoading(false);
      inFlight.current = null;
    }
  }

  // Initial load
  useEffect(() => {
    loadBonus('mount');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick every second if a bonus exists (for countdown)
  useEffect(() => {
    if (tickTimer.current) {
      window.clearInterval(tickTimer.current);
      tickTimer.current = null;
    }

    if (!bonus?.scheduledAt) return;

    tickTimer.current = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000) as unknown as number;

    return () => {
      if (tickTimer.current) {
        window.clearInterval(tickTimer.current);
        tickTimer.current = null;
      }
    };
  }, [bonus?.scheduledAt]);

  const msLeft = useMemo(() => {
    if (!bonus?.scheduledAt) return null;
    return diffMs(bonus.scheduledAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bonus?.scheduledAt, nowTick]);

  const isFiring = msLeft !== null && msLeft <= 0;

  // Determine attention mode
  const minutesLeft = msLeft !== null ? Math.floor(msLeft / 60000) : 999999;

  const mode: 'calm' | 'hot' | 'critical' | 'firing' =
    isFiring ? 'firing' : minutesLeft <= 5 ? 'critical' : minutesLeft <= 30 ? 'hot' : 'calm';

  // Background polling:
  // - If no bonus exists: poll so it can appear without refresh
  // - If bonus exists: poll depending on proximity
  useEffect(() => {
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }

    const isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;

    // Choose interval
    let interval = POLL_IDLE_MS;

    if (bonus?.scheduledAt) {
      if (mode === 'critical') interval = POLL_CRITICAL_MS;
      else if (mode === 'hot') interval = POLL_HOT_MS;
      else interval = POLL_CALM_MS;
    } else {
      interval = POLL_IDLE_MS;
    }

    // Small clamp just to avoid anything silly
    interval = clamp(interval, 4000, 120000);

    pollTimer.current = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      loadBonus('poll');
    }, interval) as unknown as number;

    // Visibility re-fetch (instant)
    function onVis() {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') loadBonus('visible');
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }

    // If tab is visible on first run, great
    if (isVisible) {
      // no-op
    }

    return () => {
      if (pollTimer.current) {
        window.clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bonus?.scheduledAt, mode]);

  // Auto-refetch shortly after firing so it doesn’t sit at 00:00:00
  useEffect(() => {
    if (!bonus?.scheduledAt) return;

    if (isFiring) {
      if (fireTimer.current) return;

      fireTimer.current = window.setTimeout(async () => {
        fireTimer.current = null;
        await loadBonus('fired');
      }, FIRE_REFETCH_DELAY_MS) as unknown as number;
    }

    return () => {
      if (fireTimer.current) {
        window.clearTimeout(fireTimer.current);
        fireTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFiring, bonus?.scheduledAt]);

  // If nothing scheduled, show nothing (keep home clean)
  if (loading && !bonus) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500" />
        Checking bonus XPOT…
      </div>
    );
  }

  if (error || !bonus) return null;

  const href = variant === 'ops' ? '/ops' : '/hub';
  const title = variant === 'ops' ? 'View bonus scheduling in Ops' : 'View and claim entries on the hub';

  const countdown = msLeft !== null ? formatHms(msLeft) : '';
  const amount = bonus.amountXpot.toLocaleString();

  // Visual attention (more “premium” when hot/critical/firing)
  const base =
    'group relative inline-flex w-full max-w-[760px] items-center gap-3 rounded-full border px-3.5 py-2 text-[11px] font-medium transition';
  const calmCls =
    'border-emerald-500/35 bg-emerald-500/8 text-emerald-100 shadow-[0_0_40px_rgba(16,185,129,0.22)] hover:bg-emerald-500/12';
  const hotCls =
    'border-emerald-400/60 bg-emerald-500/12 text-emerald-50 shadow-[0_0_70px_rgba(16,185,129,0.32)] hover:bg-emerald-500/16';
  const criticalCls =
    'border-emerald-300/80 bg-emerald-500/16 text-emerald-50 shadow-[0_0_95px_rgba(16,185,129,0.48)]';
  const firingCls =
    'border-emerald-200/90 bg-emerald-400/18 text-emerald-50 shadow-[0_0_120px_rgba(16,185,129,0.62)]';

  const cls = mode === 'firing' ? firingCls : mode === 'critical' ? criticalCls : mode === 'hot' ? hotCls : calmCls;

  const leftIcon =
    mode === 'firing' ? <Zap className="h-3.5 w-3.5" /> : mode === 'critical' ? <Sparkles className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />;

  const dotCls =
    mode === 'firing' || mode === 'critical'
      ? 'bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.95)]'
      : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]';

  const pulse = mode === 'hot' || mode === 'critical' || mode === 'firing' ? 'animate-pulse' : '';

  const label =
    mode === 'firing'
      ? 'BONUS XPOT - FIRING…'
      : mode === 'critical'
      ? 'BONUS XPOT - INCOMING'
      : mode === 'hot'
      ? 'BONUS XPOT - SOON'
      : 'BONUS XPOT';

  const timePart =
    mode === 'firing' ? (
      <span className="font-mono text-emerald-100">FIRING…</span>
    ) : (
      <span className="font-mono text-emerald-200">T-{countdown}</span>
    );

  return (
    <Link href={href} className={`${base} ${cls}`} title={title}>
      {/* premium sweep when hot+ */}
      {(mode === 'hot' || mode === 'critical' || mode === 'firing') && (
        <span
          className="
            pointer-events-none absolute inset-0 overflow-hidden rounded-full
            before:absolute before:inset-0
            before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]
            before:translate-x-[-60%]
            before:animate-[xpotBonusSweep_4.8s_linear_infinite]
            before:opacity-60
          "
        />
      )}

      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/18">
        <span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${dotCls} ${pulse}`} />
        {leftIcon}
      </span>

      <span className="min-w-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
        <span className="uppercase tracking-[0.18em] text-emerald-200/90">{label}</span>
        <span className="mx-2 text-emerald-200/60">•</span>
        {timePart}
        <span className="mx-2 text-emerald-200/60">•</span>
        <span className="text-emerald-100">+{amount} XPOT</span>
        <span className="mx-2 text-emerald-200/60">•</span>
        <span className="text-emerald-200/80">same entry</span>
      </span>

      <span className="hidden rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/90 sm:inline-flex">
        View
      </span>

      <style jsx global>{`
        @keyframes xpotBonusSweep {
          0% {
            transform: translateX(-60%);
          }
          100% {
            transform: translateX(160%);
          }
        }
      `}</style>
    </Link>
  );
}
