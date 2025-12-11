// components/BonusStrip.tsx
'use client';

import { useEffect, useState } from 'react';
import { useCountdown } from '@/lib/useCountdown';

type UpcomingBonus = {
  id: string;
  amountXpot: number;
  scheduledFor: string;
};

export default function BonusStrip({ compact = false }: { compact?: boolean }) {
  const [bonus, setBonus] = useState<UpcomingBonus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/bonus/upcoming', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load bonus XPOT');

        const data = await res.json();
        if (cancelled) return;

        setBonus(data.upcoming ?? null);
      } catch (err) {
        console.error('[XPOT] bonus strip error', err);
        if (!cancelled) setError('BONUS_LOAD_FAILED');
      }
    }

    load();
    const id = setInterval(load, 60_000); // refresh every minute
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const { label } = useCountdown(bonus?.scheduledFor ?? null);

  if (error || !bonus) return null;

  const amount = (bonus.amountXpot ?? 0).toLocaleString();

  if (compact) {
    // subtle dashboard style
    return (
      <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold uppercase tracking-[0.18em]">
              Bonus XPOT today
            </span>
          </div>
          <span className="font-mono text-xs text-emerald-200">
            {label}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-emerald-100/90">
          {amount} XPOT fires as an extra pool later today. Your today’s ticket
          is automatically included.
        </p>
      </div>
    );
  }

  // hero / homepage style
  return (
    <div className="mt-4 inline-flex max-w-full flex-wrap items-center gap-3 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.35)]">
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-80 animate-ping" />
        <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
      </span>
      <span className="font-semibold uppercase tracking-[0.22em] text-emerald-200">
        Bonus XPOT incoming
      </span>
      <span className="font-mono text-[11px] text-emerald-100">
        {amount} XPOT
      </span>
      <span className="text-[11px] text-emerald-200/80">
        fires in <span className="font-mono">{label}</span>
      </span>
      <span className="text-[11px] text-emerald-200/80">
        · Same ticket, extra pool.
      </span>
    </div>
  );
}
