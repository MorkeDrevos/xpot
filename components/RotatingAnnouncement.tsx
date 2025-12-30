'use client';

import { useEffect, useMemo, useState } from 'react';

type Announcement = {
  before?: string;
  highlight: string;
  after?: string;
  style?: 'badge' | 'text';
};

function needsSpaceBeforeAfter(after?: string) {
  if (!after) return false;
  const a = after.trimStart();
  if (!a) return false;

  // If next chunk starts with punctuation or closing chars, we do NOT inject a space.
  const first = a[0];
  if ('.!,?:;)]]}'.includes(first)) return false;

  // Quotes (avoid adding a space before a quote)
  if (first === '"' || first === "'" || first === '’' || first === '”') return false;

  // Dash-style starters: " - ..." should not get an extra injected space
  if (a.startsWith('-') || a.startsWith('–') || a.startsWith('—')) return false;

  return true;
}

/** Reusable 19.18 micro-badge */
export function Xpot1918Badge({
  label = '19.18 YEARS',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={[
        'relative inline-flex items-center',
        'rounded-full',
        'border border-emerald-400/20',
        'bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.22),rgba(0,0,0,0.28)_55%,rgba(0,0,0,0.20)_100%)]',
        'px-3 py-1',
        'shadow-[0_18px_55px_rgba(16,185,129,0.10)]',
        className,
      ].join(' ')}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/40" />
      <strong
        className={[
          'relative z-10',
          'font-semibold',
          'text-[rgb(var(--xpot-gold-2))]',
          'tracking-[0.12em]',
          'uppercase',
          'whitespace-nowrap',
        ].join(' ')}
      >
        {label}
      </strong>
    </span>
  );
}

export default function RotatingAnnouncement({
  intervalMs = 14_000,
}: {
  intervalMs?: number;
}) {
  const announcements = useMemo<Announcement[]>(
    () => [
      {
        before: 'Reserve Coverage:',
        highlight: '19.18 YEARS',
        after: '1,000,000/day locked for 7,000 days.',
        style: 'badge',
      },
      {
        before: "We're building toward becoming the",
        highlight: "world's biggest game",
        after: ', one day at a time.',
        style: 'text',
      },
    ],
    [],
  );

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const FADE_MS = 700;

    const fadeOut = window.setTimeout(() => {
      setVisible(false);
    }, Math.max(0, intervalMs - FADE_MS));

    const swap = window.setTimeout(() => {
      setIdx((i) => (i + 1) % announcements.length);
      setVisible(true);
    }, intervalMs);

    return () => {
      window.clearTimeout(fadeOut);
      window.clearTimeout(swap);
    };
  }, [idx, intervalMs, announcements.length]);

  const a = announcements[idx];

  const showBefore = !!a.before;
  const showAfter = !!a.after;

  // Always separate before -> highlight with exactly one space
  const beforeSeparator = showBefore ? ' ' : '';

  // Add a space before "after" only when needed (no broken spacing ever again)
  const afterSeparator = showAfter && needsSpaceBeforeAfter(a.after) ? ' ' : '';

  return (
    <span
      className={[
        'inline-flex items-center',
        // slightly smaller + more premium
        'text-[12px] sm:text-[13px]',
        'leading-[1.25]',
        'font-medium',
        'tracking-[-0.01em]',
        'text-white/80',
        'transition-all duration-700 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[2px]',
      ].join(' ')}
      aria-live="polite"
    >
      {showBefore && <span className="whitespace-pre-wrap text-white/70">{a.before}</span>}
      {beforeSeparator}

      {a.style === 'badge' ? (
        <Xpot1918Badge label={a.highlight} />
      ) : (
        <strong className="font-semibold text-[rgb(var(--xpot-gold-2))] whitespace-pre-wrap">{a.highlight}</strong>
      )}

      {showAfter && (
        <span className="whitespace-pre-wrap text-white/70">
          {afterSeparator}
          {a.after}
        </span>
      )}
    </span>
  );
}
