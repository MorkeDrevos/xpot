// components/WinnerAndStageStack.tsx
'use client';

import WinnerSpotlightCard from '@/components/WinnerSpotlightCard';
import EnteringStageLive from '@/components/EnteringStageLive';
import { Activity, Wifi } from 'lucide-react';

type WinnerRow = Parameters<typeof WinnerSpotlightCard>[0]['winner'];
type EntryRow = Parameters<typeof EnteringStageLive>[0]['entries'][number];

export default function WinnerAndStageStack({
  winner,
  entries,
  className = '',
}: {
  winner: WinnerRow;
  entries: EntryRow[];
  className?: string;
}) {
  const hasFeed = Array.isArray(entries) && entries.length > 0;

  return (
    <section
      className={[
        'relative overflow-hidden rounded-[32px]',
        'border border-white/10 bg-slate-950/20 ring-1 ring-white/[0.06]',
        'shadow-[0_40px_140px_rgba(0,0,0,0.55)]',
        className,
      ].join(' ')}
    >
      {/* unified premium halo */}
      <div className="pointer-events-none absolute -inset-28 opacity-80 blur-3xl bg-[radial-gradient(circle_at_18%_18%,rgba(var(--xpot-gold),0.10),transparent_62%),radial-gradient(circle_at_82%_22%,rgba(56,189,248,0.10),transparent_62%),radial-gradient(circle_at_12%_70%,rgba(16,185,129,0.10),transparent_62%),radial-gradient(circle_at_88%_78%,rgba(139,92,246,0.08),transparent_62%)]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />

      <div className="relative z-10 p-5 sm:p-6">
        {/* single header */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Activity className="h-4 w-4 text-slate-200" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
              Live activity
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            <Wifi className="h-3.5 w-3.5 text-slate-500" />
            {hasFeed ? 'Feed live' : 'Warming'}
          </div>
        </div>

        {/* sections inside the same surface */}
        <div className="mt-4 grid gap-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.02] ring-1 ring-white/[0.05]">
            <WinnerSpotlightCard winner={winner} embedded />
          </div>

          <div className="h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />

          <div className="rounded-[24px] border border-white/10 bg-white/[0.02] ring-1 ring-white/[0.05]">
            <EnteringStageLive entries={entries} embedded />
          </div>
        </div>
      </div>
    </section>
  );
}
