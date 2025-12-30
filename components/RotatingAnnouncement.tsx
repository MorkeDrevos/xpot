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
  explorerHref,
}: {
  reservesHref?: string;
  explorerHref?: string;
}) {
  // ✅ LOCKED: announcement bar is now dedicated to 19.18 only
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

  // ✅ Button style that matches the LEFT version (subtle, not filled)
  const BTN_SOFT =
    'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] ' +
    'px-5 py-2.5 text-[12px] font-semibold tracking-[0.18em] uppercase text-slate-200 ' +
    'hover:bg-white/[0.06] transition';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* LEFT: Status pill (moved here) */}
      <span
        className={[
          'inline-flex items-center gap-2 rounded-full border px-3 py-1',
          'text-[10px] font-semibold uppercase tracking-[0.22em]',
          'border-[rgba(var(--xpot-gold),0.25)] bg-[rgba(var(--xpot-gold),0.06)]',
          'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]',
        ].join(' ')}
      >
        <Crown className="h-3.5 w-3.5 text-[rgb(var(--xpot-gold-2))]" />
        Status
      </span>

      {/* CENTER: the announcement text */}
      <span
        className={[
          'min-w-0 flex-1',
          'inline-flex items-center gap-2',
          'text-[12px] sm:text-[13px]',
          'leading-[1.25]',
          'font-medium',
          'tracking-[-0.01em]',
          'text-white/80',
        ].join(' ')}
        aria-live="polite"
      >
        {showBefore && <span className="whitespace-pre-wrap text-white/70">{a.before} </span>}

        {/* 19.18 micro-badge */}
        <span
          className={[
            'relative inline-flex items-center',
            'rounded-full',
            'border border-emerald-400/20',
            'bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.22),rgba(0,0,0,0.28)_55%,rgba(0,0,0,0.20)_100%)]',
            'px-3 py-1',
            'shadow-[0_18px_55px_rgba(16,185,129,0.10)]',
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

      {/* RIGHT: both buttons (moved here) */}
      <div className="flex items-center gap-2">
        {reservesHref ? (
          <a href={reservesHref} target="_blank" rel="noreferrer" className={BTN_SOFT} title="Open reserves">
            View reserves
            <ExternalLink className="h-4 w-4 opacity-80" />
          </a>
        ) : null}

        {explorerHref ? (
          <a href={explorerHref} target="_blank" rel="noreferrer" className={BTN_SOFT} title="Open explorer">
            Explorer
            <ExternalLink className="h-4 w-4 opacity-80" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
