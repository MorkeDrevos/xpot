'use client';

import { useMemo } from 'react';
import { Crown, ExternalLink } from 'lucide-react';

type Announcement = {
  before?: string;
  highlight: string;
  after?: string;
};

function needsSpaceBetween(after?: string) {
  if (!after) return false;
  const a = after.trimStart();
  if (!a) return false;

  const first = a[0];
  if ('.!,?:;)]]}'.includes(first)) return false;
  if (first === '"' || first === "'" || first === '’' || first === '”') return false;
  if (a.startsWith('-') || a.startsWith('–') || a.startsWith('—')) return false;

  return true;
}

export default function RotatingAnnouncement({
  reservesHref,
}: {
  reservesHref?: string;
}) {
  const a = useMemo<Announcement>(
    () => ({
      before: 'Reserve Coverage:',
      highlight: '19.18 YEARS',
      after: '1,000,000/day locked for 7,000 days.',
    }),
    [],
  );

  const afterNeedsSpace = needsSpaceBetween(a.after);

  /**
   * Shared pill base
   * → ensures STATUS and VIEW RESERVES are identical in size & weight
   */
  const PILL_BASE =
    'inline-flex items-center gap-2 rounded-full border ' +
    'px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]';

  const STATUS_PILL =
    `${PILL_BASE} ` +
    'border-white/10 bg-white/[0.02] text-slate-300';

  const RESERVES_PILL =
    `${PILL_BASE} ` +
    'border-white/10 bg-white/[0.03] text-slate-200 ' +
    'hover:bg-white/[0.06] transition';

  return (
    <div
      className={[
        // Mobile: stacked + centered
        'flex flex-col items-center gap-2 text-center',
        // Desktop: inline row
        'sm:flex-row sm:justify-between sm:gap-3 sm:text-left',
      ].join(' ')}
    >
      {/* LEFT: STATUS (quiet) */}

      {/* CENTER: announcement */}
      <span
        className={[
          'inline-flex flex-wrap items-center justify-center gap-2',
          'text-[12px] sm:text-[13px]',
          'leading-[1.25] font-medium tracking-[-0.01em]',
          'text-white/80',
          'sm:justify-start',
        ].join(' ')}
        aria-live="polite"
      >
        <span className="text-white/70">{a.before} </span>

        {/* 19.18 badge */}
        <span
          className={[
            'relative inline-flex items-center rounded-full',
            'border border-emerald-400/18',
            'bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.18),rgba(0,0,0,0.28)_55%,rgba(0,0,0,0.18)_100%)]',
            'px-3 py-1',
            'shadow-[0_14px_44px_rgba(16,185,129,0.08)]',
          ].join(' ')}
        >
          <span className="absolute inset-0 rounded-full ring-1 ring-black/40" />
          <strong
            className={[
              'relative z-10',
              'text-[rgb(var(--xpot-gold-2))]',
              'font-semibold uppercase tracking-[0.10em]',
            ].join(' ')}
          >
            {a.highlight}
          </strong>
        </span>

        <span className="text-white/70">
          {afterNeedsSpace ? ' ' : ''}
          {a.after}
        </span>
      </span>

      {/* RIGHT: VIEW RESERVES (same size as STATUS) */}
      {reservesHref ? (
        <a
          href={reservesHref}
          target="_blank"
          rel="noreferrer"
          className={RESERVES_PILL}
          title="Open reserves"
        >
          View reserves
          <ExternalLink className="h-3.5 w-3.5 opacity-80" />
        </a>
      ) : null}
    </div>
  );
}
