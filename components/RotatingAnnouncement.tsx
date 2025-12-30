'use client';

import { useEffect, useMemo, useState } from 'react';

type Announcement = {
  before?: string;
  highlight: string;
  after?: string;
};

function isPunctuationStart(s: string) {
  // If the next segment starts with punctuation, we do NOT want to prepend a space.
  // Includes common punctuation and closing punctuation.
  return /^[\.\,\!\?\:\;\)\]\}]/.test(s);
}

function endsWithSpace(s: string) {
  return /\s$/.test(s);
}

function startsWithSpace(s: string) {
  return /^\s/.test(s);
}

function joinWithSmartSpace(left?: string, right?: string) {
  if (!left || !right) return false;
  if (endsWithSpace(left)) return false; // already has trailing space
  if (startsWithSpace(right)) return false; // already has leading space
  if (isPunctuationStart(right)) return false; // don't insert space before punctuation
  return true;
}

export default function RotatingAnnouncement({
  intervalMs = 14000, // slower, premium
}: {
  intervalMs?: number;
}) {
  const announcements = useMemo<Announcement[]>(
    () => [
      {
        before: "We're aiming to become the",
        highlight: 'biggest game on the planet',
        after: ". You're early. This is where it starts.",
      },
      {
        before: "We're building toward becoming the",
        highlight: "world's biggest game",
        after: ' - one day at a time.',
      },
      {
        before: 'Daily draws are the heartbeat. Final Draw is the ending -',
        highlight: 'Tuesday, 28/02/2045 22:00',
        after: ' (Madrid).',
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

  const needSpaceBeforeHighlight = joinWithSmartSpace(a.before, a.highlight);
  const needSpaceBeforeAfter = joinWithSmartSpace(a.highlight, a.after);

  return (
    <span
      className={[
        'inline-flex items-center',
        'min-w-0',
        'text-[12px] sm:text-[13px] 2xl:text-[13px]',
        'leading-[1.35]',
        'font-medium',
        'tracking-[-0.008em]',
        'text-white/78',
        'antialiased',
        'transition-all duration-800 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[2px]',
      ].join(' ')}
      aria-live="polite"
    >
      {a.before ? <span className="truncate">{a.before}</span> : null}

      {needSpaceBeforeHighlight ? ' ' : null}

      <strong
        className={[
          'font-semibold',
          'text-[rgb(var(--xpot-gold-2))]',
          'tracking-[-0.006em]',
          // Slightly calmer glow = more premium, less "neon"
          'drop-shadow-[0_0_10px_rgba(250,204,21,0.10)]',
        ].join(' ')}
      >
        {a.highlight}
      </strong>

      {a.after ? (
        <>
          {needSpaceBeforeAfter ? ' ' : null}
          <span className="truncate">{a.after}</span>
        </>
      ) : null}
    </span>
  );
}
