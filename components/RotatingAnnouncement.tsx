'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';

type Announcement = {
  before?: string;
  highlight: string;
  after?: string;
  style?: 'badge' | 'text';
};

const RESERVES_URL =
  'https://dev.xpot.bet/tokenomics?tab=rewards&focus=reserve';

function needsSpaceBeforeAfter(after?: string) {
  if (!after) return false;
  const a = after.trimStart();
  if (!a) return false;

  const first = a[0];
  if ('.!,?:;)]]}'.includes(first)) return false;
  if (first === '"' || first === "'" || first === '’' || first === '”') return false;

  return true;
}

/* Micro 19.18 badge — subdued */
function Xpot1918Badge({ label = '19.18 YEARS' }: { label?: string }) {
  return (
    <span
      className="
        inline-flex items-center
        rounded-full
        border border-emerald-400/14
        bg-emerald-300/8
        px-2.5 py-1
        text-[10px] sm:text-[11px]
        font-semibold uppercase
        tracking-[0.16em]
        text-emerald-100/90
        shadow-[0_10px_30px_rgba(0,0,0,0.30)]
        ring-1 ring-black/30
      "
    >
      {label}
    </span>
  );
}

/* Replaces Dismiss */
function ViewReservesLink() {
  return (
    <a
      href={RESERVES_URL}
      target="_blank"
      rel="noreferrer"
      className="
        inline-flex items-center gap-2
        rounded-full
        border border-white/10
        bg-white/[0.02]
        px-3 py-1.5
        text-[11px]
        font-semibold uppercase
        tracking-[0.14em]
        text-white/65
        hover:text-white/85
        hover:bg-white/[0.04]
        transition
      "
    >
      View reserves
      <ExternalLink className="h-4 w-4 opacity-70" />
    </a>
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
        before: "We're building toward becoming the",
        highlight: "world's biggest game",
        after: '- one day at a time.',
        style: 'text',
      },
      {
        before: 'Reserve Coverage:',
        highlight: '19.18 YEARS',
        after: '· 1,000,000/day locked for 7,000 days.',
        style: 'badge',
      },
    ],
    [],
  );

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const FADE_MS = 650;

    const fadeOut = window.setTimeout(
      () => setVisible(false),
      Math.max(0, intervalMs - FADE_MS),
    );

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
    <div className="flex w-full items-center justify-between gap-4">
      {/* LEFT / CENTER — quiet secondary info */}
      <div
        className={[
          'min-w-0 flex-1',
          'inline-flex items-center gap-1.5',
          'text-[12px] sm:text-[13px]',
          'leading-[1.25]',
          'font-medium',
          'tracking-[-0.01em]',
          'text-white/75',
          'transition-all duration-700 ease-out',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[2px]',
        ].join(' ')}
        aria-live="polite"
      >
        {a.before && <span className="text-white/60">{a.before}</span>}

        {a.style === 'badge' ? (
          <Xpot1918Badge label={a.highlight} />
        ) : (
          <strong className="font-semibold text-[rgb(var(--xpot-gold-2))]">
            {a.highlight}
          </strong>
        )}

        {a.after && (
          <span className="text-white/60">
            {needsSpaceBeforeAfter(a.after) ? ' ' : ''}
            {a.after}
          </span>
        )}
      </div>

      {/* RIGHT — replaces Dismiss */}
      <div className="shrink-0">
        <ViewReservesLink />
      </div>
    </div>
  );
}
