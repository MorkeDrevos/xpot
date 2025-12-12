'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { CheckCircle2, CircleDashed, ShieldCheck } from 'lucide-react';

type OpsHeaderProps = {
  title?: string;
  subtitle?: string;
  markSrc?: string; // static mark (png/svg). Example: "/brand/xpot-mark.png"
  markAlt?: string;
};

function pillBase(tone: 'gold' | 'emerald' | 'slate' | 'red') {
  const base =
    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide shadow-sm backdrop-blur';
  const tones: Record<typeof tone, string> = {
    gold: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
    slate: 'border-white/10 bg-white/5 text-slate-200',
    red: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
  };
  return `${base} ${tones[tone]}`;
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

  const envLabel = useMemo(() => (isProd ? 'PRODUCTION' : 'DEV ENVIRONMENT'), [isProd]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-5 shadow-xl">
      {/* Subtle premium background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(255,255,255,0.06),transparent)] opacity-60" />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: mark + titles */}
        <div className="flex items-center gap-4">
          <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm">
            <Image
              src={markSrc}
              alt={markAlt}
              fill
              sizes="44px"
              className="object-contain p-2"
              priority
            />
          </div>

          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-200/90">
                {title.toUpperCase()}
              </div>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <div className="text-[11px] font-semibold text-slate-400">
                ops
              </div>
            </div>

            <div className="mt-1 text-lg font-semibold text-white sm:text-xl">
              {subtitle}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Live status and controls for draws, tickets and automation
            </div>
          </div>
        </div>

        {/* Right: status pills */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className={pillBase(isProd ? 'gold' : 'slate')}>
            <ShieldCheck className="h-4 w-4" />
            {envLabel}
          </span>

          <span className={pillBase(autoDrawEnabled ? 'emerald' : 'red')}>
            {autoDrawEnabled ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <CircleDashed className="h-4 w-4" />
            )}
            AUTO DRAW {autoDrawEnabled ? 'ACTIVE' : 'PAUSED'}
          </span>

          <span className={pillBase('slate')}>
            <span className="inline-flex h-2 w-2 rounded-full bg-white/40" />
            OPERATIONS CENTER
          </span>
        </div>
      </div>
    </div>
  );
}
