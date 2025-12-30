'use client';

import { useEffect, useMemo, useState } from 'react';

type Announcement = {
  before?: string; // plain text BEFORE highlight (no trailing space needed)
  highlight: string; // highlighted phrase
  after?: string; // plain text AFTER highlight (can start with punctuation)
};

function needsSpaceBetween(before?: string) {
  if (!before) return false;
  // If before already ends with whitespace, we don't add an extra space
  return !/\s$/.test(before);
}

export default function RotatingAnnouncement({
  intervalMs = 14000, // slower, premium
}: {
  intervalMs?: number;
}) {
  const announcements = useMemo<Announcement[]>(
    () => [
      {
        before: "We're aiming to build the world's biggest game",
        highlight: 'one day at a time',
        after: '. You are early - this is where it starts.',
      },
      {
        before: 'XPOT is live',
        highlight: 'contract deployed, trading active',
        after: '. The protocol is being built in public.',
      },
      {
        // ✅ 3rd announcement: start promoting 19.18 (as requested)
        before: 'Next milestone',
        highlight: '19.18',
        after: ' - we push volume and momentum until we hit it.',
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

  return (
    <span
      className={[
        'inline-flex items-center',
        // ✅ smaller + cleaner
        'text-[12.5px] sm:text-[13px]',
        'leading-[1.35]',
        'font-medium',
        'tracking-[-0.005em]',
        'text-white/80',
        'transition-all duration-800 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[2px]',
        // ✅ make spacing more consistent
        'whitespace-nowrap',
      ].join(' ')}
      aria-live="polite"
    >
      {a.before && <span>{a.before}</span>}

      {/* ✅ Force exactly one space between before and highlight */}
      {a.before && needsSpaceBetween(a.before) && <span aria-hidden>{' '}</span>}

      <strong
        className={[
          // ✅ keep highlight premium but not huge
          'font-semibold',
          'text-[rgb(var(--xpot-gold-2))]',
          // slight text polish
          'drop-shadow-[0_1px_0_rgba(0,0,0,0.55)]',
        ].join(' ')}
      >
        {a.highlight}
      </strong>

      {/* ✅ After is rendered exactly as written (punctuation + spaces included) */}
      {a.after && <span>{a.after}</span>}
    </span>
  );
}
