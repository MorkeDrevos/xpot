// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

type XpotTopBarProps = {
  logoHref?: string;
  pillText?: string;

  // (from old version) optional extra pill on the right of the main pill
  sloganRight?: string;

  // if you pass a custom rightSlot, we render it.
  // if not, we render the default menu items (Hub, Terms, Enter…)
  rightSlot?: ReactNode;

  // If you have the purple PreLaunchBanner mounted
  hasBanner?: boolean;

  maxWidthClassName?: string; // default: max-w-[1440px]
};

export default function XpotTopBar({
  logoHref = '/',
  pillText = 'THE X-POWERED REWARD PROTOCOL',
  sloganRight,
  rightSlot,
  hasBanner = true,
  maxWidthClassName = 'max-w-[1440px]',
}: XpotTopBarProps) {
  // Overlap by 1px to kill any seam/gap forever
  const top = hasBanner ? 'calc(var(--xpot-banner-h, 0px) - 1px)' : '0px';

  const defaultRight = (
    <>
      <Link href="/hub" className="hover:text-white transition">
        Hub
      </Link>
      <Link href="/terms" className="hover:text-white transition">
        Terms
      </Link>
      <Link
        href="/hub"
        className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-200 transition"
      >
        Enter today&apos;s XPOT →
      </Link>
    </>
  );

  return (
    <header className="fixed inset-x-0 z-[50] w-full" style={{ top }}>
      {/* Bar */}
      <div className="border-b border-white/10 bg-black/55 backdrop-blur-xl">
        {/* IMPORTANT: match PageShell container padding exactly */}
        <div className={`mx-auto w-full ${maxWidthClassName} px-4 sm:px-6`}>
          {/* Make top bar tall enough for 105px logo */}
          <div className="flex min-h-[120px] items-center justify-between gap-6 py-3">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-5">
              <Link href={logoHref} className="flex shrink-0 items-center">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={380}
                  height={105}
                  priority
                  className="h-[105px] min-h-[105px] w-auto object-contain"
                />
              </Link>

              {/* Pill + optional slogan */}
              <div className="hidden sm:flex min-w-0 items-center gap-3">
                <span
                  className="
                    inline-flex min-w-0 items-center gap-2
                    rounded-full border border-white/10 bg-white/5
                    px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]
                    text-white/75
                  "
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-white/35" />
                  <span className="truncate">{pillText}</span>
                </span>

                {sloganRight ? (
                  <span className="hidden lg:inline-flex items-center rounded-full border border-white/10 bg-white/[0.035] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-200">
                    {sloganRight}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Right */}
            <div className="flex shrink-0 items-center gap-6 text-sm text-slate-300">
              {rightSlot ?? defaultRight}
            </div>
          </div>
        </div>
      </div>

      {/* Premium line (thin, fades before edges) */}
      <div className="relative h-[1px] w-full overflow-hidden">
        <div
          className="
            absolute left-1/2 top-0 h-full -translate-x-1/2
            w-[72%]
            bg-[linear-gradient(90deg,rgba(56,189,248,0.10)_0%,rgba(56,189,248,0.28)_18%,rgba(56,189,248,0.55)_50%,rgba(56,189,248,0.28)_82%,rgba(56,189,248,0.10)_100%)]
            opacity-80
          "
        />
        <div
          className="
            absolute top-0 h-full w-[20%]
            bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.28)_50%,rgba(255,255,255,0)_100%)]
            opacity-20
            animate-[xpotLineSweep_10s_linear_infinite]
          "
          style={{ left: '-20%' }}
        />
      </div>

      {/* local keyframes (no globals needed) */}
      <style jsx>{`
        @keyframes xpotLineSweep {
          from {
            left: -20%;
          }
          to {
            left: 120%;
          }
        }
      `}</style>
    </header>
  );
}
