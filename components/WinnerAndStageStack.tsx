'use client';

import WinnerSpotlightCard from '@/components/WinnerSpotlightCard';
import EnteringStageLive from '@/components/EnteringStageLive';

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
  return (
    <div
      className={[
        'relative overflow-hidden rounded-[32px]',
        'border border-white/10 bg-slate-950/20 ring-1 ring-white/[0.05]',
        'shadow-[0_40px_140px_rgba(0,0,0,0.55)]',
        className,
      ].join(' ')}
    >
      <div className="pointer-events-none absolute -inset-28 opacity-80 blur-3xl bg-[radial-gradient(circle_at_18%_18%,rgba(var(--xpot-gold),0.10),transparent_62%),radial-gradient(circle_at_82%_22%,rgba(56,189,248,0.10),transparent_62%),radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_62%)]" />

      <div className="relative p-3 sm:p-4">
        <WinnerSpotlightCard winner={winner} className="bg-transparent" />
        <div className="my-3 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />
        <EnteringStageLive entries={entries} className="bg-transparent" />
      </div>
    </div>
  );
}
