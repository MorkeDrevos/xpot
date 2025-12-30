'use client';

import { useEffect, useMemo, useState } from 'react';

type Announcement = {
  before?: string;
  highlight: string;
  after?: string;
};

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
    }, intervalMs - FADE_MS);

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
        'text-[12px] sm:text-[13px]', // smaller
        'leading-[1.2]',
        'font-medium',
        'tracking-[-0.01em]',
        'text-white/80',
        'transition-all duration-800 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[2px]',
      ].join(' ')}
      aria-live="polite"
    >
      {a.before && <span>{a.before}</span>}

      {/* ✅ force the missing space BEFORE the highlight */}
      {a.before && <span aria-hidden>{' '}</span>}

      <strong className="font-semibold text-[rgb(var(--xpot-gold-2))]">{a.highlight}</strong>

      {a.after && <span>{a.after}</span>}
    </span>
  );
}
