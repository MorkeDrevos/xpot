'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { CheckCircle2, CircleDashed } from 'lucide-react';

type OpsHeaderProps = {
  title?: string;
  subtitle?: string;
  markSrc?: string; // "/brand/xpot-mark.png"
  markAlt?: string;
};

function pillBase(tone: 'gold' | 'emerald' | 'slate' | 'red') {
  const base =
    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur';
  const tones: Record<typeof tone, string> = {
    gold: 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/25',
    emerald: 'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/25',
    slate: 'bg-white/5 text-slate-200 ring-1 ring-white/10',
    red: 'bg-rose-500/10 text-rose-200 ring-1 ring-rose-400/25',
  };
  return `${base} ${tones[tone]}`;
}

export default function OpsHeader({
  title = 'Operations Center',
  subtitle = "Control room for today’s XPOT",
  markSrc = '/brand/xpot-mark.png',
  markAlt = 'XPOT',
}: OpsHeaderProps) {
  const isProd =
    typeof window !== 'undefined' &&
    window.location.hostname &&
    !['localhost', '127.0.0.1'].includes(window.location.hostname);

  const autoDrawEnabled =
    process.env.NEXT_PUBLIC_XPOT_AUTO_DRAW_ENABLED === 'true' ||
    process.env.NEXT_PUBLIC_XPOT_AUTO_DRAW === 'true';

  const envLabel = useMemo(
    () => (isProd ? 'PRODUCTION' : 'DEV'),
    [isProd],
  );

  // Keep it premium: max 2 pills, not 3
  const pills = (
    <>
      <span className={pillBase(isProd ? 'gold' : 'slate')}>{envLabel}</span>
      <span className={pillBase(autoDrawEnabled ? 'emerald' : 'red')}>
        {autoDrawEnabled ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <CircleDashed className="h-4 w-4" />
        )}
        AUTO DRAW {autoDrawEnabled ? 'ACTIVE' : 'PAUSED'}
      </span>
    </>
  );

  return (
    <div
      className="
        relative overflow-hidden rounded-[28px]
        bg-slate-950/25
        ring-1 ring-white/5
        backdrop-blur-2xl
      "
    >
      {/* Soft, non-boxy glow (no hard card border) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-32 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-28 -right-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_25%_0%,rgba(255,255,255,0.06),transparent_55%)] opacity-70" />
      </div>

      {/* Thin top highlight line = premium */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      <div className="relative px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left */}
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
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
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-300/90">
                  {title}
                </span>
                <span className="h-1 w-1 rounded-full bg-white/25" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  ops
                </span>
              </div>

              <div className="mt-1 text-[17px] font-semibold text-slate-50 sm:text-[19px]">
                {subtitle}
              </div>

              <div className="mt-1 text-sm text-slate-400">
                Live status and controls for draws, tickets and automation
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {pills}
          </div>
        </div>
      </div>
    </div>
  );
}
