'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Xpot1918Badge from '@/components/Xpot1918Badge';

type Announcement = {
  kind: 'badge' | 'text';
  before?: string;
  highlight: string;
  after?: string;
};

export default function RotatingAnnouncement({
  intervalMs = 16000,
  actionHref = '/tokenomics#reserve',
  actionLabel = 'Reserve →',
}: {
  intervalMs?: number;
  actionHref?: string;
  actionLabel?: string;
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
  }, [intervalMs, announcements.length]);

  const a = announcements[idx];

  return (
    <div className="flex w-full items-center justify-between gap-3">
      {/* LEFT: Rotating message */}
      <span
        className={[
          'min-w-0',
          'inline-flex items-center flex-wrap',
          'text-[11px] sm:text-[12px] md:text-[13px]',
          'leading-[1.2]',
          'font-medium',
          'tracking-[-0.01em]',
          'text-white/80',
          'transition-all duration-700 ease-out',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[2px]',
        ].join(' ')}
        aria-live="polite"
      >
        {a.before ? <span className="text-white/70">{a.before}&nbsp;</span> : null}

        {a.kind === 'badge' ? (
          <Xpot1918Badge className="shrink-0" label={a.highlight} />
        ) : (
          <strong className="font-semibold text-[rgb(var(--xpot-gold-2))]">{a.highlight}</strong>
        )}

        {a.after ? <span className="text-white/70">&nbsp;{a.after}</span> : null}
      </span>

      {/* RIGHT: replaces dismiss button */}
      <Link
        href={actionHref}
        target="_blank"
        rel="noreferrer"
        className={[
          'shrink-0',
          'inline-flex items-center justify-center',
          'rounded-full',
          'border border-white/10 bg-white/[0.04]',
          'px-3 py-1.5',
          'text-[11px] font-semibold tracking-[0.14em] uppercase',
          'text-slate-100 hover:bg-white/[0.07]',
          'shadow-[0_12px_40px_rgba(0,0,0,0.35)]',
          'transition',
        ].join(' ')}
      >
        {actionLabel}
      </Link>
    </div>
  );
}
