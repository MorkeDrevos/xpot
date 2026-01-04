'use client';

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
  cta?: React.ReactNode; // pass your "Claim entry" button here from page
}) {
  return (
    <section
      className={[
        'relative overflow-hidden rounded-[40px]',
        'border border-white/10 bg-slate-950/18 ring-1 ring-white/[0.06]',
        'shadow-[0_55px_220px_rgba(0,0,0,0.74)]',
        className,
      ].join(' ')}
    >
      {/* premium ambient field */}
      <div className="pointer-events-none absolute -inset-28 opacity-85 blur-3xl bg-[radial-gradient(circle_at_12%_18%,rgba(var(--xpot-gold),0.16),transparent_58%),radial-gradient(circle_at_85%_26%,rgba(56,189,248,0.12),transparent_62%),radial-gradient(circle_at_45%_95%,rgba(16,185,129,0.10),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.20)_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.60),rgba(56,189,248,0.34),transparent)] opacity-85" />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-4 px-6 pt-6 sm:px-7 sm:pt-7">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-500">
            Live activity
          </div>
          <div className="mt-1 text-[19px] font-semibold tracking-tight text-slate-100 sm:text-[21px]">
            {title}
          </div>
        </div>

        {cta ? <div className="shrink-0">{cta}</div> : null}
      </div>

      {/* Unified console body */}
      <div className="relative mt-5 px-6 pb-6 sm:px-7 sm:pb-7">
        <div
          className={[
            'relative overflow-hidden rounded-[30px]',
            'border border-white/10 bg-slate-950/22 ring-1 ring-white/[0.05]',
            'shadow-[0_34px_160px_rgba(0,0,0,0.60)]',
          ].join(' ')}
        >
          {/* thin inner rim */}
          <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-white/[0.06]" />
          {/* subtle sweep */}
          <div className="pointer-events-none absolute -inset-24 opacity-75 blur-3xl bg-[radial-gradient(circle_at_14%_40%,rgba(56,189,248,0.09),transparent_60%),radial-gradient(circle_at_86%_44%,rgba(var(--xpot-gold),0.09),transparent_62%)]" />

          {/* Winner lane (embedded - no outer card) */}
          <div className="relative px-5 py-5 sm:px-6 sm:py-6">
            <WinnerSpotlightCard winner={winner} embedded compact={false} />
          </div>

          {/* Premium seam divider */}
          <div className="relative px-5 sm:px-6">
            <div className="pointer-events-none h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),rgba(var(--xpot-gold),0.20),rgba(56,189,248,0.14),rgba(255,255,255,0.08),transparent)] opacity-85" />
          </div>

          {/* Entering lane (bigger avatars + bigger text) */}
          <div className="relative px-5 py-5 sm:px-6 sm:py-6">
            <EnteringStageLive
              entries={entries}
              embedded
              // vip shows handle + (optional) name line, so it reads bigger and clearer
              variant="vip"
              avatarSize={40}
              max={10}
              className=""
            />
          </div>
        </div>
      </div>
    </section>
  );
}
