// components/LiveActivityModule.tsx
'use client';

import type { ReactNode } from 'react';

import WinnerSpotlightCard from '@/components/WinnerSpotlightCard';
import EnteringStageLive, { type EntryRow } from '@/components/EnteringStageLive';

export type LiveWinnerRow = Parameters<typeof WinnerSpotlightCard>[0]['winner'];

export default function LiveActivityModule({
  winner,
  entries,
  className = '',
  title = "Today's entries and the latest winner",
  cta,
}: {
  winner: LiveWinnerRow;
  entries: EntryRow[];
  className?: string;
  title?: string;
  cta?: ReactNode; // pass your "Claim entry" button here from page
}) {
  return (
    <section
      className={[
        'relative overflow-hidden rounded-[36px]',
        'border border-white/10 bg-slate-950/18 ring-1 ring-white/[0.06]',
        'shadow-[0_50px_200px_rgba(0,0,0,0.72)]',
        className,
      ].join(' ')}
    >
      {/* premium ambient field */}
      <div className="pointer-events-none absolute -inset-28 opacity-80 blur-3xl bg-[radial-gradient(circle_at_12%_18%,rgba(var(--xpot-gold),0.14),transparent_58%),radial-gradient(circle_at_85%_26%,rgba(56,189,248,0.10),transparent_62%),radial-gradient(circle_at_45%_95%,rgba(16,185,129,0.09),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.20)_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.55),rgba(56,189,248,0.30),transparent)] opacity-80" />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-500">
            Live activity
          </div>
          <div className="mt-1 text-[18px] font-semibold text-slate-100 sm:text-[19px]">
            {title}
          </div>
        </div>

        {cta ? <div className="shrink-0">{cta}</div> : null}
      </div>

      {/* Unified console body */}
      <div className="relative mt-5 px-6 pb-6">
        <div
          className={[
            'relative overflow-hidden rounded-[28px]',
            'border border-white/10 bg-slate-950/22 ring-1 ring-white/[0.05]',
            'shadow-[0_30px_140px_rgba(0,0,0,0.58)]',
          ].join(' ')}
        >
          {/* thin inner rim */}
          <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-white/[0.06]" />
          {/* subtle sweep */}
          <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_14%_40%,rgba(56,189,248,0.08),transparent_60%),radial-gradient(circle_at_86%_44%,rgba(var(--xpot-gold),0.08),transparent_62%)]" />

          {/* Winner lane (embedded - no outer card) */}
          <div className="relative px-4 py-4 sm:px-5 sm:py-5">
            {/* embedded keeps it “inside console”; compact={false} = bigger */}
            <WinnerSpotlightCard winner={winner} embedded compact={false} />
          </div>

          {/* Premium seam divider */}
          <div className="relative px-4 sm:px-5">
            <div className="pointer-events-none h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),rgba(var(--xpot-gold),0.18),rgba(56,189,248,0.12),rgba(255,255,255,0.08),transparent)] opacity-85" />
          </div>

          {/* Entering lane (NO HOVER) */}
          <div className="relative px-4 py-4 sm:px-5 sm:py-5">
            <EnteringStageLive
              entries={entries}
              embedded
              // ✅ ticker has no hover tooltip cards (clean + premium)
              variant="ticker"
              // Bigger pills
              max={10}
              className=""
              // label stays nice
              label="Entering the stage"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
