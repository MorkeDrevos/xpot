'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

type XpotTopBarProps = {
  logoHref?: string;
  pillText?: string;
  sloganRight?: string;
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
  // If --xpot-banner-h is missing, we fall back to 56px so the bar never hides under the purple banner.
  const top = hasBanner ? 'calc(var(--xpot-banner-h, 56px))' : '0px';

  return (
    <header className="fixed inset-x-0 z-[60] w-full" style={{ top }}>
      {/* Bar */}
      <div className="bg-black/70 backdrop-blur-md border-b border-white/5">
        {/* IMPORTANT: match PageShell container padding exactly */}
        <div className={`mx-auto w-full ${maxWidthClassName} px-4 sm:px-6`}>
          <div className="flex h-[104px] items-center justify-between gap-6">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-4">
              <Link href={logoHref} className="flex items-center gap-3 shrink-0">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={260}
                  height={110}
                  priority
                  className="h-[92px] w-auto object-contain"
                />
              </Link>

              {/* Pill + optional slogan */}
              <div className="hidden sm:flex min-w-0 items-center gap-3">
                <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-300">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300/70 shadow-[0_0_10px_rgba(148,163,184,0.35)]" />
                  <span className="truncate opacity-85">{pillText}</span>
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
              {rightSlot ?? (
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
              )}
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
