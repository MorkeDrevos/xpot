'use client';

import { useEffect, useMemo, useState } from 'react';

type Announcement = {
  kind: 'badge' | 'text';
  before?: string;
  highlight: string;
  after?: string;
};

/* 19.18 micro-badge (locked) */
function Xpot1918Badge({ label }: { label: string }) {
  return (
    <span
      className="
        relative inline-flex items-center
        rounded-full
        border border-emerald-400/20
        bg-emerald-400/10
        px-3 py-1
        shadow-[0_14px_40px_rgba(16,185,129,0.10)]
      "
    >
      <strong
        className="
          font-semibold
          text-[rgb(var(--xpot-gold-2))]
          tracking-[0.12em]
          uppercase
          whitespace-nowrap
        "
      >
        {label}
      </strong>
    </span>
  );
}

export default function RotatingAnnouncement({
  intervalMs = 16000,
}: {
  intervalMs?: number;
}) {
  const announcements = useMemo<Announcement[]>(
    () => [
      {
        // ✅ PRIMARY — structural truth
        kind: 'badge',
        before: 'Reserve Coverage:',
        highlight: '19.18 YEARS',
        after: '· 1,000,000/day locked for 7,000 days.',
      },
      {
        // ✅ SECONDARY — narrative vision
        kind: 'text',
        before: "We're building toward becoming the",
        highlight: "world's biggest game",
        after: '— one day at a time.',
      },
    ],
    [],
  );

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const FADE_MS = 700;

    const fadeOut = setTimeout(() => setVisible(false), intervalMs - FADE_MS);
    const swap = setTimeout(() => {
      setIdx((i) => (i + 1) % announcements.length);
      setVisible(true);
    }, intervalMs);

    return () => {
      clearTimeout(fadeOut);
      clearTimeout(swap);
    };
  }, [intervalMs, announcements.length]);

  const a = announcements[idx];

  return (
    <span
      className={[
        'inline-flex items-center',
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
      {a.before && <span className="text-white/70">{a.before}{' '}</span>}

      {a.kind === 'badge' ? (
        <Xpot1918Badge label={a.highlight} />
      ) : (
        <strong className="font-semibold text-[rgb(var(--xpot-gold-2))]">
          {a.highlight}
        </strong>
      )}

      {a.after && <span className="text-white/70">{' '}{a.after}</span>}
    </span>
  );
}
