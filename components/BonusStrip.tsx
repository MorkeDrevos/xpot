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

export default function BonusStrip() {
  const [bonus, setBonus] = useState<BonusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  const firingRefetchTimer = useRef<number | null>(null);
  const lastBonusId = useRef<string | null>(null);

  async function loadBonus() {
    try {
      setError(null);
      const res = await fetch('/api/bonus/upcoming', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Expected: { bonus: null | { ... } }
      if (data?.bonus) {
        const b: BonusInfo = {
          id: data.bonus.id,
          label: data.bonus.label ?? 'Bonus XPOT',
          amountXpot: Number(data.bonus.amountXpot ?? 0),
          scheduledAt: data.bonus.scheduledAt,
          status: data.bonus.status,
        };

        setBonus(b);
        lastBonusId.current = b.id;
      } else {
        setBonus(null);
      }
    } catch (e) {
      console.error('[BonusStrip] loadBonus failed', e);
      setError('FAILED_TO_LOAD');
      // silent fail: keep UI clean
      setBonus(null);
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadBonus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick every second if we have a bonus scheduled
  useEffect(() => {
    if (!bonus?.scheduledAt) return;

    const id = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(id);
  }, [bonus?.scheduledAt]);

  const msLeft = useMemo(() => {
    if (!bonus?.scheduledAt) return null;
    return diffMs(bonus.scheduledAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bonus?.scheduledAt, nowTick]);

  const isFiring = msLeft !== null && msLeft <= 0;

  // Auto-refetch after firing so it doesn’t sit on 00:00:00
  useEffect(() => {
    if (!bonus?.scheduledAt) return;

    if (isFiring) {
      if (firingRefetchTimer.current) return;

      // Refetch shortly after 0 to allow ops job to flip status
      firingRefetchTimer.current = window.setTimeout(async () => {
        firingRefetchTimer.current = null;
        await loadBonus();
      }, 3500) as unknown as number;
    }

    return () => {
      if (firingRefetchTimer.current) {
        window.clearTimeout(firingRefetchTimer.current);
        firingRefetchTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFiring, bonus?.scheduledAt]);

  // If nothing scheduled, show nothing (or keep your “none scheduled” pill if you prefer)
  if (loading && !bonus) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500" />
        Checking bonus XPOT…
      </div>
    );
  }

  if (error || !bonus) {
    return null;
  }

  // Attention modes
  const minutesLeft = msLeft !== null ? Math.floor(msLeft / 60000) : 999999;

  const mode: 'calm' | 'hot' | 'critical' | 'firing' =
    isFiring ? 'firing' : minutesLeft <= 5 ? 'critical' : minutesLeft <= 30 ? 'hot' : 'calm';

  const countdown = msLeft !== null ? formatHms(msLeft) : '';
  const amount = bonus.amountXpot.toLocaleString();

  const base =
    'group inline-flex w-full max-w-[640px] items-center gap-3 rounded-full border px-3.5 py-2 text-[11px] font-medium shadow-[0_0_40px_rgba(16,185,129,0.22)] transition';
  const calmCls =
    'border-emerald-500/35 bg-emerald-500/8 text-emerald-100 hover:bg-emerald-500/12';
  const hotCls =
    'border-emerald-400/60 bg-emerald-500/12 text-emerald-100 shadow-[0_0_55px_rgba(16,185,129,0.30)] hover:bg-emerald-500/16';
  const criticalCls =
    'border-emerald-300/80 bg-emerald-500/16 text-emerald-50 shadow-[0_0_85px_rgba(16,185,129,0.45)]';
  const firingCls =
    'border-emerald-200/90 bg-emerald-400/18 text-emerald-50 shadow-[0_0_110px_rgba(16,185,129,0.55)]';

  const cls =
    mode === 'firing'
      ? firingCls
      : mode === 'critical'
      ? criticalCls
      : mode === 'hot'
      ? hotCls
      : calmCls;

  const leftIcon =
    mode === 'firing' ? (
      <Zap className="h-3.5 w-3.5" />
    ) : mode === 'critical' ? (
      <Sparkles className="h-3.5 w-3.5" />
    ) : (
      <Activity className="h-3.5 w-3.5" />
    );

  const dotCls =
    mode === 'firing' || mode === 'critical'
      ? 'bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.95)]'
      : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]';

  const pulse =
    mode === 'hot' || mode === 'critical' || mode === 'firing' ? 'animate-pulse' : '';

  const label =
    mode === 'firing'
      ? 'BONUS XPOT - FIRING…'
      : mode === 'critical'
      ? 'BONUS XPOT - INCOMING'
      : 'BONUS XPOT';

  const timePart =
    mode === 'firing' ? (
      <span className="font-mono text-emerald-100">FIRING…</span>
    ) : (
      <span className="font-mono text-emerald-200">T-{countdown}</span>
    );

  // Make it clickable to dashboard (feels “real”)
  return (
    <Link
      href="/dashboard"
      className={`${base} ${cls}`}
      title="View and claim entries on the dashboard"
    >
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/18">
        <span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${dotCls} ${pulse}`} />
        {leftIcon}
      </span>

      <span className="min-w-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
        <span className="uppercase tracking-[0.18em] text-emerald-200/90">
          {label}
        </span>
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
    </Link>
  );
}
