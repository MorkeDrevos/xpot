// components/RotatingAnnouncement.tsx
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
  // ✅ LOCKED: announcement bar is dedicated to 19.18 only
  const a = useMemo<Announcement>(
    () => ({
      before: 'Reserve Coverage:',
      highlight: '19.18 YEARS',
      after: '1,000,000/day locked for 7,000 days.',
    }),
    [],
  );

  const showBefore = !!a.before;
  const showAfter = !!a.after;
  const afterNeedsSpace = needsSpaceBetween(a.after);

  // ✅ Smaller, subtler button (matches LEFT style, not the big filled one)
  const BTN_SOFT_SM =
    'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] ' +
    'px-4 py-2 text-[11px] font-semibold tracking-[0.16em] uppercase text-slate-200 ' +
    'hover:bg-white/[0.06] transition';

  // ✅ Status pill: calmer / less loud (logo already there)
  const STATUS_PILL =
    'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] ' +
    'px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-slate-300';

  return (
    <div
      className={[
        // Mobile: centered, stacked
        'flex flex-col items-center justify-center gap-2 text-center',
        // Desktop: single row, spaced
        'sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-left',
      ].join(' ')}
    >
      {/* LEFT: Status pill (subtle) */}
      <span className={STATUS_PILL}>
        <Crown className="h-3.5 w-3.5 text-slate-300/80" />
        Status
      </span>

      {/* CENTER: announcement */}
      <span
        className={[
          'min-w-0',
          'inline-flex flex-wrap items-center justify-center gap-2',
          'text-[12px] sm:text-[13px]',
          'leading-[1.25] font-medium tracking-[-0.01em]',
          'text-white/80',
          'sm:justify-start',
        ].join(' ')}
        aria-live="polite"
      >
        {showBefore && <span className="whitespace-pre-wrap text-white/70">{a.before} </span>}

        {/* 19.18 micro-badge */}
        <span
          className={[
            'relative inline-flex items-center',
            'rounded-full',
            'border border-emerald-400/18',
            'bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.18),rgba(0,0,0,0.28)_55%,rgba(0,0,0,0.18)_100%)]',
            'px-3 py-1',
            'shadow-[0_14px_44px_rgba(16,185,129,0.08)]',
            'shrink-0',
          ].join(' ')}
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/40" />
          <strong
            className={[
              'relative z-10',
              'font-semibold',
              'text-[rgb(var(--xpot-gold-2))]',
              'tracking-[0.10em]',
              'uppercase',
              'whitespace-pre-wrap',
            ].join(' ')}
          >
            {a.highlight}
          </strong>
        </span>

        {showAfter && (
          <span className="whitespace-pre-wrap text-white/70">
            {afterNeedsSpace ? ' ' : ''}
            {a.after}
          </span>
        )}
      </span>

      {/* RIGHT: only reserves button (no explorer) */}
      <div className="flex items-center justify-center">
        {reservesHref ? (
          <a
            href={reservesHref}
            target="_blank"
            rel="noreferrer"
            className={BTN_SOFT_SM}
            title="Open reserves"
          >
            View reserves
            <ExternalLink className="h-4 w-4 opacity-80" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
