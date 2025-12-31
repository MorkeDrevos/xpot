'use client';

import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';

type Announcement = {
  eyebrow?: string;
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
      eyebrow: 'Reserve Coverage',
      highlight: '19.18 YEARS LOCKED',
      after: '1,000,000 XPOT/day locked for 7,000 days.',
    }),
    [],
  );

  const afterNeedsSpace = needsSpaceBetween(a.after);

  const BTN_SOFT_SM =
    'inline-flex items-center gap-2 rounded-full ' +
    'border border-emerald-400/25 bg-emerald-400/[0.07] ' +
    'px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ' +
    'text-emerald-100 hover:bg-emerald-400/[0.11] transition';

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {/* CENTER (mobile) / LEFT (desktop): announcement */}
      <span
        className={[
          'flex flex-wrap items-center justify-center gap-2 sm:justify-start',
          'text-[12px] sm:text-[13px]',
          'leading-[1.25]',
          'tracking-[-0.01em]',
          'text-white/85',
        ].join(' ')}
        aria-live="polite"
      >
        {/* Eyebrow: make it feel like a headline */}
        {a.eyebrow && (
          <span
            className={[
              'whitespace-nowrap',
              'text-white/75',
              'font-semibold',
              'uppercase',
              'tracking-[0.14em]',
              'text-[10px] sm:text-[11px]',
            ].join(' ')}
          >
            {a.eyebrow}:
          </span>
        )}

        {/* Big badge */}
        <span
          className={[
            'relative inline-flex items-center',
            'rounded-full',
            'border border-emerald-400/35',
            'bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.34),rgba(0,0,0,0.38)_55%,rgba(0,0,0,0.28)_100%)]',
            'px-3.5 py-1.5',
            'shadow-[0_16px_50px_rgba(16,185,129,0.28)]',
          ].join(' ')}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/45"
          />
          <strong
            className={[
              'relative z-10',
              'font-extrabold',
              'text-emerald-200',
              'tracking-[0.16em]',
              'uppercase',
              'whitespace-nowrap',
              'text-[11px] sm:text-[12px]',
            ].join(' ')}
          >
            {a.highlight}
          </strong>
        </span>

        {a.after && (
          <span className="whitespace-pre-wrap text-white/75 font-medium">
            {afterNeedsSpace ? ' ' : ''}
            {/* make 7,000 days feel important */}
            {a.after.split('7,000 days')[0]}
            <span className="text-white/90 font-semibold">7,000 days</span>
            {a.after.split('7,000 days')[1] ?? ''}
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
