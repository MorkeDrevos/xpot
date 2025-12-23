// components/BonusStrip.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Activity, Sparkles, Zap, ChevronRight } from 'lucide-react';

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

// Polling (tuned to feel live without hammering)
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

  // Background polling
  useEffect(() => {
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }

    // Choose interval
    let interval = POLL_IDLE_MS;

    if (bonus?.scheduledAt) {
      if (mode === 'critical') interval = POLL_CRITICAL_MS;
      else if (mode === 'hot') interval = POLL_HOT_MS;
      else interval = POLL_CALM_MS;
    } else {
      interval = POLL_IDLE_MS;
    }

    interval = clamp(interval, 4000, 120000);

    pollTimer.current = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      loadBonus('poll');
    }, interval) as unknown as number;

    function onVis() {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') loadBonus('visible');
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
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
  if (loading && !bonus) return null;
  if (error || !bonus) return null;

  const href = variant === 'ops' ? '/ops' : '/hub';
  const title = variant === 'ops' ? 'View bonus scheduling in Ops' : 'View and claim entries on the hub';

  const countdown = msLeft !== null ? formatHms(msLeft) : '';
  const amount = bonus.amountXpot.toLocaleString();

  const label =
    mode === 'firing'
      ? 'BONUS XPOT FIRING'
      : mode === 'critical'
      ? 'BONUS XPOT INCOMING'
      : mode === 'hot'
      ? 'BONUS XPOT SOON'
      : 'BONUS XPOT';

  const leftIcon =
    mode === 'firing' ? <Zap className="h-4 w-4" /> : mode === 'critical' ? <Sparkles className="h-4 w-4" /> : <Activity className="h-4 w-4" />;

  const ring =
    mode === 'firing'
      ? 'border-emerald-200/70'
      : mode === 'critical'
      ? 'border-emerald-300/55'
      : mode === 'hot'
      ? 'border-emerald-400/45'
      : 'border-emerald-500/30';

  const glow =
    mode === 'firing'
      ? 'shadow-[0_0_0_1px_rgba(52,211,153,0.28),0_24px_120px_rgba(16,185,129,0.22)]'
      : mode === 'critical'
      ? 'shadow-[0_0_0_1px_rgba(52,211,153,0.22),0_22px_110px_rgba(16,185,129,0.18)]'
      : mode === 'hot'
      ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_18px_90px_rgba(16,185,129,0.14)]'
      : 'shadow-[0_0_0_1px_rgba(16,185,129,0.14),0_18px_70px_rgba(16,185,129,0.10)]';

  const pulse = mode === 'hot' || mode === 'critical' || mode === 'firing' ? 'animate-pulse' : '';

  return (
    <Link
      href={href}
      className={[
        'group relative block w-full',
        'rounded-[22px] border bg-slate-950/55 backdrop-blur-xl',
        ring,
        glow,
        'transition hover:bg-slate-950/62',
      ].join(' ')}
      title={title}
    >
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px]">
        <span className="absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_10%_30%,rgba(16,185,129,0.22),transparent_58%),radial-gradient(circle_at_90%_20%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.06),transparent_60%)]" />
        {(mode === 'hot' || mode === 'critical' || mode === 'firing') && (
          <span className="absolute -left-[35%] top-[-40%] h-[220%] w-[55%] rotate-[10deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),rgba(56,189,248,0.10),rgba(16,185,129,0.10),transparent)] opacity-0 [animation:xpotBonusSheen_6.2s_ease-in-out_infinite]" />
        )}
        <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.55),rgba(255,255,255,0.08),rgba(56,189,248,0.35),transparent)] opacity-80" />
        <span className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),rgba(16,185,129,0.35),transparent)] opacity-70" />
      </span>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/18 bg-emerald-500/10">
            <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.95)] ${pulse}`} />
            {leftIcon}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/90">
                {label}
              </span>
              <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                Same entry
                <span className="h-1 w-1 rounded-full bg-white/20" />
                Paid on-chain
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-300">
              <span className="font-mono text-emerald-200">
                {mode === 'firing' ? 'FIRING…' : `T-${countdown}`}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-100 font-semibold">+{amount} XPOT</span>
              <span className="text-slate-600">•</span>
              <span className="truncate text-slate-400">{bonus.label || 'Bonus XPOT'}</span>
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/18 bg-emerald-500/10 px-4 py-2 text-[11px] font-semibold text-emerald-200 transition group-hover:bg-emerald-500/14">
          View
          <ChevronRight className="h-4 w-4 opacity-80 transition group-hover:translate-x-0.5" />
        </span>
      </div>

      <style jsx global>{`
        @keyframes xpotBonusSheen {
          0% { transform: translateX(-140%) rotate(10deg); opacity: 0.0; }
          12% { opacity: 0.34; }
          55% { opacity: 0.14; }
          100% { transform: translateX(160%) rotate(10deg); opacity: 0.0; }
        }
      `}</style>
    </Link>
  );
}
