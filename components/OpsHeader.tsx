'use client';

import Image from 'next/image';
import { useMemo } from 'react';

type OpsHeaderProps = {
  title?: string;
  subtitle?: string;
  markSrc?: string; // static mark (png/svg). Example: "/brand/xpot-mark.png"
  markAlt?: string;
};

function pillBase(tone: 'gold' | 'emerald' | 'slate' | 'red') {
  // Slimmer + more premium (less “badge”)
  const base =
    'inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur';

  const tones: Record<typeof tone, string> = {
    gold: 'border-amber-400/25 bg-amber-500/8 text-amber-200',
    emerald: 'border-emerald-400/25 bg-emerald-500/8 text-emerald-200',
    slate: 'border-white/10 bg-white/5 text-slate-200',
    red: 'border-rose-400/25 bg-rose-500/8 text-rose-200',
  };

  return `${base} ${tones[tone]}`;
}

function Dot({ tone }: { tone: 'gold' | 'emerald' | 'slate' | 'red' }) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-300/80 shadow-[0_0_10px_rgba(52,211,153,0.35)]'
      : tone === 'gold'
      ? 'bg-amber-300/80 shadow-[0_0_10px_rgba(251,191,36,0.28)]'
      : tone === 'red'
      ? 'bg-rose-300/80 shadow-[0_0_10px_rgba(251,113,133,0.28)]'
      : 'bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.14)]';

  return <span className={`h-1.5 w-1.5 rounded-full ${cls}`} />;
}

export default function OpsHeader({
  title = 'Operations Center',
  subtitle = "Control room for today’s XPOT",
  markSrc = '/brand/xpot-mark.png',
  markAlt = 'XPOT',
}: OpsHeaderProps) {
  // Environment (safe, no backend dependency)
  const isProd =
    typeof window !== 'undefined' &&
    window.location.hostname &&
    !['localhost', '127.0.0.1'].includes(window.location.hostname);

  // Auto-draw flag (must be NEXT_PUBLIC to work on client)
  const autoDrawEnabled =
    process.env.NEXT_PUBLIC_XPOT_AUTO_DRAW_ENABLED === 'true' ||
    process.env.NEXT_PUBLIC_XPOT_AUTO_DRAW === 'true';

  const envLabel = useMemo(
    () => (isProd ? 'PRODUCTION' : 'DEV ENVIRONMENT'),
    [isProd],
  );

  return (
    <div
      className="
        relative overflow-hidden
        rounded-[24px]
        bg-slate-950/20
        ring-1 ring-white/6
        backdrop-blur-xl
      "
    >
      {/* Subtle premium background (less glow, less boxy) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-32 h-80 w-80 rounded-full bg-amber-500/7 blur-3xl" />
        <div className="absolute -bottom-28 -right-32 h-80 w-80 rounded-full bg-emerald-500/7 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(255,255,255,0.05),transparent)] opacity-60" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/8" />
      </div>

      <div className="relative flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        {/* Left: mark + titles */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <Image
              src={markSrc}
              alt={markAlt}
              fill
              sizes="40px"
              className="object-contain p-2"
              priority
            />
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-extrabold tracking-[0.24em] text-slate-200/90">
                {title.toUpperCase()}
              </div>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                ops
              </div>
            </div>

            <div className="mt-1 truncate text-lg font-semibold text-white sm:text-xl">
              {subtitle}
            </div>

            <div className="mt-1 text-sm text-slate-400">
              Live status and controls for draws, tickets and automation
            </div>
          </div>
        </div>

        {/* Right: status pills (lighter, fewer, cleaner) */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className={pillBase(isProd ? 'gold' : 'slate')}>
            <Dot tone={isProd ? 'gold' : 'slate'} />
            {envLabel}
          </span>

          <span className={pillBase(autoDrawEnabled ? 'emerald' : 'red')}>
            <Dot tone={autoDrawEnabled ? 'emerald' : 'red'} />
            AUTO DRAW {autoDrawEnabled ? 'ACTIVE' : 'PAUSED'}
          </span>
        </div>
      </div>
    </div>
  );
}
