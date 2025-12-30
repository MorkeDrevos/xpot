// components/RotatingAnnouncement.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Crown, ExternalLink } from 'lucide-react';

type Announcement = {
  kind: 'badge' | 'text';
  before?: string;
  highlight: string;
  after?: string;
};

const RESERVES_URL = 'https://dev.xpot.bet/tokenomics?tab=rewards&focus=reserve';

function firstNonSpaceChar(s: string) {
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== ' ' && c !== '\n' && c !== '\t') return c;
  }
  return '';
}

function shouldInsertSpace(beforeChunk?: string) {
  if (!beforeChunk) return false;
  const c = firstNonSpaceChar(beforeChunk);
  if (!c) return false;

  // no leading space before punctuation/closing chars
  if ('.!,?:;)]}'.includes(c)) return false;
  if (c === '"' || c === "'" || c === '’' || c === '”') return false;
  // no space before dash starters (we keep your hyphen style)
  if (c === '-' || c === '–' || c === '—') return false;

  return true;
}

/* 19.18 micro-badge (reusable) */
export function Xpot1918Badge({
  label = '19.18 YEARS',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={[
        'relative inline-flex items-center',
        'rounded-full',
        'border border-emerald-400/18',
        'bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.18),rgba(0,0,0,0.30)_55%,rgba(0,0,0,0.22)_100%)]',
        'px-3 py-1',
        'shadow-[0_18px_55px_rgba(16,185,129,0.10)]',
        'ring-1 ring-black/35',
        className,
      ].join(' ')}
    >
      <strong
        className={[
          'relative z-10',
          'font-semibold',
          'text-[rgb(var(--xpot-gold-2))]',
          'tracking-[0.12em]',
          'uppercase',
          'whitespace-nowrap',
        ].join(' ')}
      >
        {label}
      </strong>
    </span>
  );
}

function StatusPill({ label = 'STATUS' }: { label?: string }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full',
        'border border-white/14 bg-white/[0.03]',
        'px-4 py-2',
        'shadow-[0_16px_60px_rgba(0,0,0,0.45)]',
        'ring-1 ring-black/35',
      ].join(' ')}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/25">
        <Crown className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
      </span>

      <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/90">
        {label}
      </span>
    </span>
  );
}

function ViewReservesButton() {
  return (
    <a
      href={RESERVES_URL}
      target="_blank"
      rel="noreferrer"
      className={[
        'inline-flex items-center gap-2 rounded-full',
        'border border-emerald-400/18 bg-emerald-300/10',
        'px-5 py-2.5',
        'text-[12px] font-semibold tracking-[0.18em] uppercase',
        'text-emerald-50',
        'shadow-[0_18px_60px_rgba(16,185,129,0.12)]',
        'hover:bg-emerald-300/14 hover:brightness-[1.03]',
        'transition',
      ].join(' ')}
      title="Open reserves"
    >
      View reserves
      <ExternalLink className="h-4 w-4 opacity-85" />
    </a>
  );
}

function RotatingLine({ a }: { a: Announcement }) {
  const showBefore = !!a.before;
  const showAfter = !!a.after;

  const insertBeforeSpace = showBefore; // always separate before -> highlight
  const insertAfterSpace = showAfter ? shouldInsertSpace(a.after) : false;

  return (
    <span
      className={[
        'inline-flex items-center',
        'text-[12px] sm:text-[13px]',
        'leading-[1.25]',
        'font-medium',
        'tracking-[-0.01em]',
        'text-white/80',
      ].join(' ')}
    >
      {showBefore && (
        <span className="text-white/70 whitespace-pre-wrap">
          {a.before}
          {insertBeforeSpace ? ' ' : ''}
        </span>
      )}

      {a.kind === 'badge' ? (
        <Xpot1918Badge label={a.highlight} />
      ) : (
        <strong className="font-semibold text-[rgb(var(--xpot-gold-2))] whitespace-pre-wrap">
          {a.highlight}
        </strong>
      )}

      {showAfter && (
        <span className="text-white/70 whitespace-pre-wrap">
          {insertAfterSpace ? ' ' : ''}
          {a.after}
        </span>
      )}
    </span>
  );
}

export default function RotatingAnnouncement({
  intervalMs = 16000,
  labelLeft = 'STATUS',
}: {
  intervalMs?: number;
  labelLeft?: string;
}) {
  const announcements = useMemo<Announcement[]>(
    () => [
      {
        kind: 'badge',
        before: 'Reserve Coverage:',
        highlight: '19.18 YEARS',
        after: ' - 1,000,000/day locked for 7,000 days.',
      },
      {
        kind: 'text',
        before: "We're building toward becoming the",
        highlight: "world's biggest game",
        after: ' - one day at a time.',
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

  return (
    <div className="flex w-full items-center gap-5">
      {/* LEFT */}
      <div className="shrink-0">
        <StatusPill label={labelLeft} />
      </div>

      {/* CENTER */}
      <div className="min-w-0 flex-1">
        <div
          className={[
            'transition-all duration-700 ease-out',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[2px]',
          ].join(' ')}
          aria-live="polite"
        >
          <RotatingLine a={a} />
        </div>
      </div>

      {/* RIGHT (replaces Dismiss) */}
      <div className="shrink-0">
        <ViewReservesButton />
      </div>
    </div>
  );
}
