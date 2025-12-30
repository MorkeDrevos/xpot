'use client';

import { useEffect, useMemo, useState } from 'react';
import Xpot1918Badge from '@/components/Xpot1918Badge';

type Announcement = {
  kind: 'badge' | 'text';
  before?: string;
  highlight: string;
  after?: string;
};

// If the "after" starts with punctuation, don't inject a space.
function afterNeedsSpace(after?: string) {
  if (!after) return false;
  const a = after.trimStart();
  if (!a) return false;

  const first = a[0];
  if ('.!,?:;)]]}'.includes(first)) return false;
  if (first === '"' || first === "'" || first === '’' || first === '”') return false;
  if (a.startsWith('-') || a.startsWith('–')) return false;

  return true;
}

export default function RotatingAnnouncement({
  intervalMs = 16000,
}: {
  intervalMs?: number;
}) {
  const announcements = useMemo<Announcement[]>(
    () => [
      {
        kind: 'badge',
        before: 'Reserve Coverage:',
        highlight: '19.18 YEARS',
        after: '· 1,000,000/day locked for 7,000 days.',
      },
      {
        kind: 'text',
        before: "We're building toward becoming the",
        highlight: "world's biggest game",
        after: '- one day at a time.',
      },
    ],
    [],
  );

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const FADE_MS = 700;

    const fadeOut = window.setTimeout(() => setVisible(false), Math.max(0, intervalMs - FADE_MS));
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
  const needs = afterNeedsSpace(a.after);

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
      {a.before && <span className="text-white/70">{a.before} </span>}

      {a.kind === 'badge' ? (
        <Xpot1918Badge label={a.highlight} />
      ) : (
        <strong className="font-semibold text-[rgb(var(--xpot-gold-2))]">{a.highlight}</strong>
      )}

      {a.after && <span className="text-white/70">{needs ? ' ' : ''}{a.after}</span>}
    </span>
  );
}
