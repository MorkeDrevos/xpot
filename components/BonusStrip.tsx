'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Timer } from 'lucide-react';

type BonusInfo = {
  label: string;
  amountXpot: number;
  scheduledAt: string; // ISO string
};

type BonusStripProps = {
  variant?: 'home' | 'default';
  className?: string;
};

function formatCountdown(targetIso: string | null): string {
  if (!targetIso) return '';
  const now = Date.now();
  const target = new Date(targetIso).getTime();
  const diff = target - now;

  if (diff <= 0) return '00:00:00';

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function BonusStrip({ variant = 'default', className = '' }: BonusStripProps) {
  const [bonus, setBonus] = useState<BonusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Load upcoming bonus once on mount
  useEffect(() => {
    let cancelled = false;

    async function loadBonus() {
      try {
        setLoading(true);

        const res = await fetch('/api/bonus/upcoming', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        if (data?.bonus?.scheduledAt) {
          setBonus({
            label: data.bonus.label ?? 'Bonus XPOT',
            amountXpot: data.bonus.amountXpot ?? 0,
            scheduledAt: data.bonus.scheduledAt,
          });
        } else {
          setBonus(null);
        }
      } catch {
        // silent fail - homepage stays clean
        if (!cancelled) setBonus(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBonus();

    return () => {
      cancelled = true;
    };
  }, []);

  // Tick every second to update countdown (only when we have a scheduled bonus)
  useEffect(() => {
    if (!bonus?.scheduledAt) return;

    const id = window.setInterval(() => setTick(t => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [bonus?.scheduledAt]);

  const countdown = useMemo(() => {
    if (!bonus?.scheduledAt) return '';
    return formatCountdown(bonus.scheduledAt);
  }, [bonus?.scheduledAt, tick]);

  if (loading && !bonus) {
    return (
      <div
        className={[
          'inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-400',
          className,
        ].join(' ')}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500" />
        Checking bonus…
      </div>
    );
  }

  if (!bonus) return null;

  // ─────────────────────────────────────────────
  // HOME variant (premium, scanable, one-line)
  // ─────────────────────────────────────────────
  if (variant === 'home') {
    return (
      <div
        className={[
          'inline-flex flex-wrap items-center gap-2 rounded-full',
          'border border-emerald-500/30 bg-emerald-500/10',
          'px-3.5 py-2 text-[11px] text-emerald-100',
          'shadow-[0_0_28px_rgba(16,185,129,0.22)]',
          className,
        ].join(' ')}
      >
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
            <Activity className="h-3.5 w-3.5 text-emerald-200" />
          </span>

          <span className="font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Bonus XPOT
          </span>
        </span>

        <span className="text-emerald-200/70">·</span>

        <span className="inline-flex items-center gap-1 text-emerald-100/90">
          <Timer className="h-3.5 w-3.5 text-emerald-200/70" />
          Next in <span className="font-mono text-emerald-200">{countdown}</span>
        </span>

        <span className="text-emerald-200/70">·</span>

        <span className="font-semibold text-emerald-100">
          +{bonus.amountXpot.toLocaleString()} XPOT
        </span>

        <span className="text-emerald-200/60">same entry</span>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // DEFAULT variant (your current richer sentence)
  // ─────────────────────────────────────────────
  return (
    <div
      className={[
        'inline-flex items-center gap-3 rounded-full',
        'border border-emerald-500/60 bg-emerald-500/10',
        'px-3.5 py-1 text-[11px] font-medium text-emerald-100',
        'shadow-[0_0_30px_rgba(16,185,129,0.35)]',
        className,
      ].join(' ')}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
        <Activity className="h-3.5 w-3.5" />
      </span>

      <span className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
        <span className="uppercase tracking-[0.18em] text-emerald-300">
          Bonus XPOT incoming
        </span>
        <span className="text-emerald-100/90">
          {bonus.amountXpot.toLocaleString()} XPOT · fires in{' '}
          <span className="font-mono text-emerald-200">{countdown}</span> · same ticket, extra pool.
        </span>
      </span>
    </div>
  );
}
