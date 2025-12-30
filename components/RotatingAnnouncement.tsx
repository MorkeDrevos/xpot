'use client';

import { useEffect, useMemo, useState } from 'react';

type RotatingAnnouncementProps = {
  className?: string;
  intervalMs?: number; // how long each message stays visible
};

export default function RotatingAnnouncement({
  className = '',
  intervalMs = 12000, // ✅ slower (12s)
}: RotatingAnnouncementProps) {
  // ✅ message 1 = original from the mission bar (img 2)
  // ✅ message 2 = the one you want to move from the left line (img 1)
  const messages = useMemo(
    () => [
      `We're aiming to become the biggest game on the planet. You're early. This is where it starts.`,
      `We're building toward becoming the world's biggest game - one day at a time.`,
      // If you want the "Tuesday" line to rotate in too, add it here as a 3rd message:
      // `Daily draws are the heartbeat. Final Draw is the ending - Tuesday, 28/02/2045 22:00 (Madrid).`,
    ],
    [],
  );

  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (messages.length <= 1) return;

    // ✅ Smooth cycle: visible -> fade out -> swap -> fade in
    const FADE_MS = 700;

    const t1 = window.setTimeout(() => setShow(false), intervalMs - FADE_MS);
    const t2 = window.setTimeout(() => {
      setIdx((i) => (i + 1) % messages.length);
      setShow(true);
    }, intervalMs);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [idx, intervalMs, messages.length]);

  return (
    <span
      className={[
        // ✅ premium type: slightly tighter tracking + stronger weight + better contrast
        'inline-flex min-w-0 items-center',
        'text-[13px] sm:text-[14px]',
        'font-semibold',
        'tracking-[-0.01em]',
        'text-white/85',
        'drop-shadow-[0_1px_0_rgba(0,0,0,0.55)]',
        // ✅ smooth transition: opacity + slight vertical drift
        'transition-all duration-700 ease-out',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[2px]',
        className,
      ].join(' ')}
      aria-live="polite"
    >
      <span className="min-w-0 truncate">{messages[idx]}</span>
    </span>
  );
}
