'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import Xpot1918Badge from '@/components/Xpot1918Badge';

type Announcement =
  | {
      kind: 'reserve';
      prefix: string;
      badge: string;
      suffix: string;
    }
  | {
      kind: 'text';
      textBefore: string;
      highlight: string;
      textAfter: string;
    };

const RESERVES_URL = 'https://dev.xpot.bet/tokenomics?tab=rewards&focus=reserve';

function ViewReservesLink() {
  return (
    <a
      href={RESERVES_URL}
      target="_blank"
      rel="noreferrer"
      className={[
        // subtle, not a CTA pill
        'inline-flex items-center gap-2 rounded-full',
        'border border-white/10 bg-white/[0.02]',
        'px-3 py-1.5',
        'text-[11px] font-semibold tracking-[0.14em] uppercase',
        'text-white/70 hover:text-white/85',
        'hover:bg-white/[0.04]',
        'transition',
      ].join(' ')}
      title="Open reserves"
    >
      View reserves
      <ExternalLink className="h-4 w-4 opacity-70" />
    </a>
  );
}

function RotatingLine({ a }: { a: Announcement }) {
  if (a.kind === 'reserve') {
    return (
      <span className="inline-flex items-center gap-2 min-w-0">
        <span className="text-white/60">{a.prefix}</span>

        {/* micro-badge + guaranteed spacing via gap */}
        <Xpot1918Badge label={a.badge} subdued />

        <span className="text-white/60 truncate">{a.suffix}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="text-white/60">{a.textBefore}</span>
      <strong className="font-semibold text-[rgb(var(--xpot-gold-2))]">{a.highlight}</strong>
      <span className="text-white/60">{a.textAfter}</span>
    </span>
  );
}

export default function RotatingAnnouncement({
  intervalMs = 16000,
}: {
  intervalMs?: number;
}) {
  // ✅ calm order: vision first, reserves second
  const announcements = useMemo<Announcement[]>(
    () => [
      {
        kind: 'text',
        textBefore: "We're building toward becoming the",
        highlight: "world's biggest game",
        textAfter: '- one day at a time.',
      },
      {
        kind: 'reserve',
        prefix: 'Reserve Coverage:',
        badge: '19.18 YEARS',
        suffix: '1,000,000/day locked for 7,000 days.',
      },
    ],
    [],
  );

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const FADE_MS = 650;

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

  return (
    <div className="flex w-full items-center justify-between gap-4">
      {/* LEFT/CENTER: calm line (no extra pills here) */}
      <div
        className={[
          'min-w-0 flex-1',
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
        <RotatingLine a={a} />
      </div>

      {/* RIGHT: replaces dismiss placement */}
      <div className="shrink-0">
        <ViewReservesLink />
      </div>
    </div>
  );
}
