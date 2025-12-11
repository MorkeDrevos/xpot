'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

type BonusInfo = {
  label: string;
  amountXpot: number;
  scheduledAt: string; // ISO string
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

export default function BonusStrip() {
  const [bonus, setBonus] = useState<BonusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Poll upcoming bonus once on mount
  useEffect(() => {
    let cancelled = false;

    async function loadBonus() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/bonus/upcoming');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        if (data && data.bonus) {
          setBonus({
            label: data.bonus.label ?? 'Bonus XPOT',
            amountXpot: data.bonus.amountXpot ?? 0,
            scheduledAt: data.bonus.scheduledAt,
          });
        } else {
          setBonus(null);
        }
      } catch (err) {
        console.error('[XPOT] Failed to load upcoming bonus', err);
        if (!cancelled) {
          setError('Could not load bonus XPOT right now.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBonus();

    return () => {
      cancelled = true;
    };
  }, []);

  // Tick every second to update countdown
  useEffect(() => {
    if (!bonus?.scheduledAt) return;

    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, [bonus?.scheduledAt]);

  if (loading && !bonus) {
    // Small skeleton shimmer
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500" />
        Checking bonus XPOT…
      </div>
    );
  }

  if (error || !bonus) {
    // Silent fail: home page still looks clean if no bonus is scheduled
    return null;
  }

  const countdown = formatCountdown(bonus.scheduledAt);

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3.5 py-1 text-[11px] font-medium text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.35)]">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
        <Activity className="h-3.5 w-3.5" />
      </span>
      <span className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
        <span className="uppercase tracking-[0.18em] text-emerald-300">
          Bonus XPOT incoming
        </span>
        <span className="text-emerald-100/90">
          {bonus.amountXpot.toLocaleString()} XPOT · fires in{' '}
          <span className="font-mono text-emerald-200">{countdown}</span>{' '}
          · same ticket, extra pool.
        </span>
      </span>
    </div>
  );
}
