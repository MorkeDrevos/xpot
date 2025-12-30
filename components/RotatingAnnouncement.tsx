'use client';

import { useMemo } from 'react';

type Announcement = {
  before?: string;
  highlight: string;
  after?: string;
};

function needsSpaceBetween(after?: string) {
  if (!after) return false;
  const a = after.trimStart();
  if (!a) return false;

  // If next chunk starts with punctuation, we do NOT inject a space.
  const first = a[0];
  if ('.!,?:;)]]}'.includes(first)) return false;
  if (first === '"' || first === "'" || first === '’' || first === '”') return false;
  if (a.startsWith('-') || a.startsWith('–') || a.startsWith('—')) return false;

  return true;
}

export default function RotatingAnnouncement() {
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

  return (
    <span
      className={[
        'inline-flex items-center gap-2',
        'text-[12px] sm:text-[13px]',
        'leading-[1.25]',
        'font-medium',
        'tracking-[-0.01em]',
        'text-white/80',
      ].join(' ')}
      aria-live="polite"
    >
      {showBefore && (
        <span className="whitespace-pre-wrap text-white/70">
          {a.before}
          {' '}
        </span>
      )}

      {/* 19.18 micro-badge */}
      <span
        className={[
          'relative inline-flex items-center',
          'rounded-full',
          'border border-emerald-400/20',
          'bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.22),rgba(0,0,0,0.28)_55%,rgba(0,0,0,0.20)_100%)]',
          'px-3 py-1',
          'shadow-[0_18px_55px_rgba(16,185,129,0.10)]',
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
  );
}
