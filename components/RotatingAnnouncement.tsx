// components/XpotAnnouncementBar.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Crown, ExternalLink } from 'lucide-react';

type Announcement =
  | {
      kind: 'reserve';
      labelLeft?: string;
      prefix: string; // "Reserve Coverage:"
      badge: string; // "19.18 YEARS"
      suffix: string; // "1,000,000/day locked for 7,000 days."
    }
  | {
      kind: 'text';
      labelLeft?: string;
      before: string;
      highlight: string;
      after: string;
    };

function Xpot1918Badge({ label }: { label: string }) {
  return (
    <span
      className={[
        'relative inline-flex items-center',
        'rounded-full',
        'border border-emerald-400/18',
        'bg-[radial-gradient(circle_at_35%_25%,rgba(16,185,129,0.18),rgba(0,0,0,0.28)_55%,rgba(0,0,0,0.18)_100%)]',
        'px-3 py-1',
        'shadow-[0_14px_50px_rgba(16,185,129,0.10)]',
      ].join(' ')}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/40" />
      <span aria-hidden className="pointer-events-none absolute inset-x-2 top-0 h-px bg-white/10" />
      <strong
        className={[
          'relative z-10',
          'text-[11px] sm:text-[12px]',
          'font-semibold',
          'tracking-[0.14em]',
          'uppercase',
          'text-[rgb(var(--xpot-gold-2))]',
          'whitespace-nowrap',
        ].join(' ')}
      >
        {label}
      </strong>
    </span>
  );
}

export default function XpotAnnouncementBar({
  intervalMs = 16_000,
  href = 'https://dev.xpot.bet/tokenomics?tab=rewards&focus=reserve',
}: {
  intervalMs?: number;
  href?: string;
}) {
  const announcements = useMemo<Announcement[]>(
    () => [
      {
        kind: 'reserve',
        labelLeft: 'STATUS',
        prefix: 'Reserve Coverage:',
        badge: '19.18 YEARS',
        suffix: '1,000,000/day locked for 7,000 days.',
      },
      {
        kind: 'text',
        labelLeft: 'STATUS',
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
    <div className="relative w-full">
      <div className="relative border-y border-white/5 bg-black/35 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
          <div className="flex min-h-[64px] items-center gap-4">
            {/* LEFT label */}
            <div
              className={[
                'inline-flex items-center gap-3',
                'rounded-full border border-white/12 bg-white/[0.03]',
                'px-5 py-2',
                'shadow-[0_18px_60px_rgba(0,0,0,0.35)]',
              ].join(' ')}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/30">
                <Crown className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-100/90">
                {a.labelLeft ?? 'STATUS'}
              </span>
            </div>

            {/* CENTER text */}
            <div className="min-w-0 flex-1">
              <div
                className={[
                  'min-w-0',
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
                {a.kind === 'reserve' ? (
                  <span className="inline-flex min-w-0 flex-wrap items-center">
                    <span className="text-white/70">{a.prefix}</span>
                    <span className="mx-2">
                      <Xpot1918Badge label={a.badge} />
                    </span>
                    <span className="text-white/60" aria-hidden>
                      •
                    </span>
                    <span className="ml-2 text-white/70">{a.suffix}</span>
                  </span>
                ) : (
                  <span className="inline-flex min-w-0 flex-wrap items-center">
                    <span className="text-white/70">{a.before}</span>
                    <span className="mx-1.5 font-semibold text-[rgb(var(--xpot-gold-2))]">{a.highlight}</span>
                    <span className="text-white/70">{a.after}</span>
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT action (replaces Dismiss) */}
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                'ml-auto inline-flex items-center gap-2',
                'rounded-full border border-white/12 bg-white/[0.03]',
                'px-5 py-2.5',
                'text-[13px] font-semibold text-slate-100',
                'hover:bg-white/[0.06]',
                'shadow-[0_18px_60px_rgba(0,0,0,0.30)]',
                'transition',
              ].join(' ')}
              title="View reserves"
            >
              View reserves
              <ExternalLink className="h-4 w-4 text-slate-200/80" />
            </Link>
          </div>
        </div>
      </div>

      {/* subtle premium line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.30),rgba(236,72,153,0.18),transparent)]" />
    </div>
  );
}
