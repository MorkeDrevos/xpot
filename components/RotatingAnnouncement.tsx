'use client';

import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';

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
      after: '1,000,000 XPOT/day reserved for 7,000 days.',
    }),
    [],
  );

  const afterNeedsSpace = needsSpaceBetween(a.after);

  // Subtle pill size — matches height of badge
  const BTN_SOFT_SM =
    'inline-flex items-center gap-2 rounded-full ' +
    'border border-emerald-400/20 bg-emerald-400/[0.06] ' +
    'px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ' +
    'text-emerald-100 hover:bg-emerald-400/[0.10] transition';

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {/* CENTER (mobile) / LEFT (desktop): announcement */}
      <span
        className={[
          'flex flex-wrap items-center justify-center gap-2 sm:justify-start',
          'text-[12px] sm:text-[13px]',
          'leading-[1.25]',
          'font-medium',
          'tracking-[-0.01em]',
          'text-white/80',
        ].join(' ')}
        aria-live="polite"
      >
        {a.before && (
          <span className="whitespace-pre-wrap text-white/70">
            {a.before}{' '}
          </span>
        )}

        {/* ✅ 19.18 badge — restored GREEN */}
        <span
          className={[
            'relative inline-flex items-center',
            'rounded-full',
            'border border-emerald-400/30',
            'bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.30),rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.25)_100%)]',
            'px-3 py-1',
            'shadow-[0_14px_40px_rgba(16,185,129,0.25)]',
          ].join(' ')}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/40"
          />
          <strong
            className={[
              'relative z-10',
              'font-semibold',
              'text-emerald-200',
              'tracking-[0.12em]',
              'uppercase',
              'whitespace-nowrap',
            ].join(' ')}
          >
            {a.highlight}
          </strong>
        </span>

        {a.after && (
          <span className="whitespace-pre-wrap text-white/70">
            {afterNeedsSpace ? ' ' : ''}
            {a.after}
          </span>
        )}
      </span>

      {/* RIGHT (desktop) / CENTER (mobile): View reserves */}
      {reservesHref && (
        <div className="flex justify-center sm:justify-end">
          <a
            href={reservesHref}
            target="_blank"
            rel="noreferrer"
            className={BTN_SOFT_SM}
            title="Open reserves"
          >
            View reserves
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </a>
        </div>
      )}
    </div>
  );
}
