// components/RotatingAnnouncement.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Announcement = {
  before?: string;
  highlight: string;
  after?: string;
};

function needsSpaceBetween(left?: string, right?: string) {
  if (!left || !right) return false;

  // If either side already includes spacing at the boundary, don't add.
  if (/\s$/.test(left)) return false;
  if (/^\s/.test(right)) return false;

  // If the right side starts with punctuation, don't add a space.
  if (/^[\.\,\!\?\:\;\)\]]/.test(right)) return false;

  // If the left side ends with an opening bracket, don't add.
  if (/[\(\[\{]$/.test(left)) return false;

  return true;
}

export default function RotatingAnnouncement({
  intervalMs = 14000, // slower, premium
}: {
  intervalMs?: number;
}) {
  // IMPORTANT: keep strings TRIMMED (no leading/trailing spaces).
  // Spacing is handled in render so it can’t break again.
  const announcements = useMemo<Announcement[]>(
    () => [
      {
        before: "We're aiming to become the",
        highlight: 'biggest game on the planet',
        after: "You're early. This is where it starts.",
      },
      {
        before: "We're building toward becoming the",
        highlight: "world's biggest game",
        after: 'One day at a time.',
      },
      {
        before: 'Bonus window',
        highlight: '19:18 (Madrid)',
        after: 'Be connected and ready.',
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

  const b = a.before ?? '';
  const h = a.highlight ?? '';
  const af = a.after ?? '';

  const spaceBH = needsSpaceBetween(b, h);
  const spaceHA = needsSpaceBetween(h, af);

  return (
    <span
      className={[
        'min-w-0',
        'inline-flex items-center',
        'text-[12.5px] sm:text-[13px]', // smaller + cleaner
        'leading-[1.35]',
        'font-medium',
        'tracking-[-0.008em]',
        'text-white/80',
        'transition-all duration-700 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[2px]',
      ].join(' ')}
      aria-live="polite"
    >
      {b ? <span className="text-white/78">{b}</span> : null}

      {spaceBH ? <span>{' '}</span> : null}

      <strong
        className={[
          'relative',
          'font-semibold',
          'text-[rgb(var(--xpot-gold-2))]',
          // tiny premium glow without changing your palette system
          'drop-shadow-[0_0_10px_rgba(var(--xpot-gold-2),0.12)]',
        ].join(' ')}
      >
        {h}
      </strong>

      {af ? (
        <>
          {spaceHA ? <span>{' '}</span> : null}
          <span className="text-white/78">{af}</span>
        </>
      ) : null}
    </span>
  );
}
