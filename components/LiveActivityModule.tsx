// components/LiveActivityModule.tsx
'use client';

import type { ReactNode } from 'react';
import { Crown, Radio, Sparkles, Ticket, Users } from 'lucide-react';

import WinnerSpotlightCard from '@/components/WinnerSpotlightCard';
import EnteringStageLive, { type EntryRow } from '@/components/EnteringStageLive';

export type LiveWinnerRow = Parameters<typeof WinnerSpotlightCard>[0]['winner'];

export default function LiveActivityModule({
  winner,
  entries,
  className = '',
  title = 'Live activity',
  subtitle = "Today's spotlight and who just entered",
  cta,
}: {
  winner: LiveWinnerRow;
  entries: EntryRow[];
  className?: string;
  title?: string;
  subtitle?: string;
  cta?: ReactNode;
}) {
  return (
    <section
      className={[
        'relative overflow-hidden rounded-[40px]',
        'border border-white/10 bg-slate-950/20 ring-1 ring-white/[0.06]',
        'shadow-[0_60px_220px_rgba(0,0,0,0.75)]',
        className,
      ].join(' ')}
    >
      <style jsx global>{`
        @keyframes xpotPremiereSweep {
          0% {
            transform: translateX(-55%) skewX(-14deg);
            opacity: 0;
          }
          14% {
            opacity: 0.16;
          }
          50% {
            opacity: 0.08;
          }
          100% {
            transform: translateX(55%) skewX(-14deg);
            opacity: 0;
          }
        }
        .xpot-premiere-sweep {
          position: absolute;
          inset: -60px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 30%,
            rgba(var(--xpot-gold), 0.10) 48%,
            rgba(56, 189, 248, 0.06) 66%,
            transparent 100%
          );
          mix-blend-mode: screen;
          opacity: 0;
          animation: xpotPremiereSweep 13.5s ease-in-out infinite;
          filter: blur(0.2px);
        }

        @keyframes xpotGoldShimmer {
          0% {
            transform: translateX(-40%);
            opacity: 0;
          }
          20% {
            opacity: 0.5;
          }
          60% {
            opacity: 0.25;
          }
          100% {
            transform: translateX(40%);
            opacity: 0;
          }
        }
        .xpot-gold-shimmer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(var(--xpot-gold), 0.10) 35%,
            rgba(255, 255, 255, 0.08) 50%,
            rgba(var(--xpot-gold), 0.10) 65%,
            transparent 100%
          );
          mix-blend-mode: screen;
          opacity: 0;
        }
        .group:hover .xpot-gold-shimmer {
          animation: xpotGoldShimmer 1.15s ease-out 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .xpot-premiere-sweep {
            animation: none;
            opacity: 0.08;
          }
          .group:hover .xpot-gold-shimmer {
            animation: none;
          }
        }
      `}</style>

      {/* Hollywood "premiere" atmosphere */}
      <div className="pointer-events-none absolute -inset-36 opacity-90 blur-3xl bg-[radial-gradient(circle_at_10%_22%,rgba(var(--xpot-gold),0.18),transparent_60%),radial-gradient(circle_at_88%_18%,rgba(56,189,248,0.14),transparent_62%),radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.10),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.22)_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="xpot-premiere-sweep" aria-hidden />

      {/* Velvet-ish top rule */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.55),rgba(255,255,255,0.10),rgba(56,189,248,0.25),transparent)] opacity-85" />

      {/* Header */}
      <div className="relative flex flex-wrap items-start justify-between gap-4 px-6 pt-6 sm:px-7">
        <div className="min-w-0">
          <div className="inline-flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-200">
              <Radio className="h-3.5 w-3.5 text-emerald-200" />
              Live
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--xpot-gold),0.22)] bg-[rgba(var(--xpot-gold),0.08)] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgb(var(--xpot-gold-2))] shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]">
              <Ticket className="h-3.5 w-3.5" />
              Premiere Console
            </span>
          </div>

          <div className="mt-3 text-pretty text-[20px] font-semibold tracking-tight text-slate-50 sm:text-[22px]">
            {title}
          </div>
          <div className="mt-1 text-[13px] leading-relaxed text-slate-400">{subtitle}</div>
        </div>

        {cta ? <div className="shrink-0">{cta}</div> : null}
      </div>

      {/* Body */}
      <div className="relative px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
        <div
          className={[
            'relative overflow-hidden rounded-[30px]',
            'border border-white/10 bg-slate-950/22 ring-1 ring-white/[0.06]',
            'shadow-[0_35px_160px_rgba(0,0,0,0.62)]',
          ].join(' ')}
        >
          {/* inner rim + sheen */}
          <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-white/[0.06]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />

          {/* "Spotlight beams" */}
          <div className="pointer-events-none absolute -inset-10 opacity-60 blur-2xl bg-[conic-gradient(from_220deg_at_20%_20%,rgba(var(--xpot-gold),0.16),transparent_30%,rgba(56,189,248,0.10),transparent_55%,rgba(16,185,129,0.08),transparent_75%,rgba(var(--xpot-gold),0.12))]" />

          {/* Layout: stacked mobile, split desktop */}
          <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            {/* LEFT: Spotlight */}
            <div className="relative p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2">
                  <Crown className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-200">
                    Spotlight winner
                  </span>
                </div>

                <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-2">
                  <Sparkles className="h-4 w-4 text-slate-300" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    On-chain proof
                  </span>
                </div>
              </div>

              {/* Big winner card lives inside the console */}
              <div className="group relative">
                <div className="xpot-gold-shimmer" aria-hidden />
                <WinnerSpotlightCard winner={winner} embedded compact={false} />
              </div>
            </div>

            {/* Divider */}
            <div className="relative lg:py-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),rgba(var(--xpot-gold),0.16),rgba(56,189,248,0.10),rgba(255,255,255,0.08),transparent)] opacity-80 lg:hidden" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.10),rgba(var(--xpot-gold),0.16),rgba(56,189,248,0.12),rgba(255,255,255,0.08),transparent)] opacity-75 hidden lg:block" />
            </div>

            {/* RIGHT: Entering stage */}
            <div className="relative p-4 sm:p-5 lg:pl-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2">
                  <Users className="h-4 w-4 text-sky-200" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-200">
                    Entering the stage
                  </span>
                </div>
              </div>

              {/* No hover tooltips: ticker is clean + premium */}
              <EnteringStageLive
                entries={entries}
                embedded
                variant="ticker"
                max={10}
                className="rounded-[22px] border border-white/10 bg-white/[0.02] ring-1 ring-white/[0.05] shadow-[0_20px_90px_rgba(0,0,0,0.45)]"
                label="Cast list"
              />

              <div className="mt-3 text-[12px] leading-relaxed text-slate-500">
                Handles are clickable and open on X in a new tab.
              </div>
            </div>
          </div>

          {/* Bottom trim */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] opacity-60" />
        </div>
      </div>
    </section>
  );
}
