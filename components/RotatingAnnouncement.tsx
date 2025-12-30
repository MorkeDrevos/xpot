'use client';

import { useEffect, useMemo, useState } from 'react';

type Announcement = {
  before?: string;
  highlight: string;
  after?: string;
};

function needsSpaceBetween(highlight: string, after?: string) {
  if (!after) return false;
  const a = after.trimStart();
  if (!a) return false;

  // If next chunk starts with punctuation, we do NOT inject a space.
  // (.,!?:;) and closing parens/brackets and quotes and dash-style starters.
  const first = a[0];
  if ('.!,?:;)]]}'.includes(first)) return false;
  if (first === '"' || first === "'" || first === '’' || first === '”') return false;
  if (a.startsWith('-') || a.startsWith('–') || a.startsWith('—')) return false;

  // Default: add a space.
  return true;
}

export default function RotatingAnnouncement({
  intervalMs = 14000, // slower, premium
}: {
  intervalMs?: number;
}) {
  // NOTE: keep before/after natural, WITHOUT relying on trailing/leading spaces for layout.
  // Spacing is handled in render below.
  const announcements = useMemo<Announcement[]>(
    () => [
      {
        before: 'Mission is simple:',
        highlight: 'become the biggest game on the planet',
        after: "You're early. This is where it starts.",
      },
      {
        before: 'Daily draws are the heartbeat. Final Draw:',
        highlight: 'Tuesday, 28/02/2045 22:00',
        after: '(Madrid).',
      },
      {
        before: 'Next chapter loading:',
        highlight: '19:18',
        after: 'Stay close. The signal starts here.',
      },
    ],
    [],
  );

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const FADE_MS = 800;

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

  // We render with explicit separators so spacing never breaks again.
  const showBefore = !!a.before;
  const showAfter = !!a.after;

  const afterNeedsSpace = needsSpaceBetween(a.highlight, a.after);
  const beforeNeedsSpace = showBefore; // always separate before -> highlight with a space

  return (
    <span
      className={[
        'inline-flex items-center',
        // smaller + cleaner
        'text-[12px] sm:text-[13px]',
        'leading-[1.25]',
        'font-medium',
        'tracking-[-0.01em]',
        'text-white/80',
        'transition-all duration-800 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[2px]',
      ].join(' ')}
      aria-live="polite"
    >
      {showBefore && (
        <span className="whitespace-pre-wrap">
          {a.before}
          {beforeNeedsSpace ? ' ' : ''}
        </span>
      )}

      <strong className="font-semibold text-[rgb(var(--xpot-gold-2))] whitespace-pre-wrap">
        {a.highlight}
      </strong>

      {showAfter && (
        <span className="whitespace-pre-wrap">
          {afterNeedsSpace ? ' ' : ''}
          {a.after}
        </span>
      )}
    </span>
  );
}
