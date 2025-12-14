'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import XpotLogo from '@/components/XpotLogo';

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
  // Kill banner seam forever
  const top = hasBanner ? 'calc(var(--xpot-banner-h, 0px) - 1px)' : '0px';

  return (
    <header className="fixed inset-x-0 z-[60] w-full" style={{ top }}>
      {/* BAR */}
      <div className="border-b border-white/5 bg-black/70 backdrop-blur-md">
        <div className={`mx-auto w-full ${maxWidthClassName} px-4 sm:px-6`}>
          <div className="flex min-h-[124px] items-center justify-between gap-6">
            {/* LEFT */}
            <div className="flex min-w-0 items-center gap-4">
              <Link href={logoHref} className="flex shrink-0 items-center">
                {/* ✅ ANIMATED LOGO (this was missing) */}
                <XpotLogo
                  variant="animated"
                  width={460}
                  height={118}
                  className="min-h-[118px]"
                />
              </Link>

              {/* PROTOCOL PILL */}
              <div className="hidden min-w-0 items-center gap-3 sm:flex">
                <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-slate-300">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300/70 shadow-[0_0_10px_rgba(148,163,184,0.35)]" />
                  <span className="truncate opacity-85">{pillText}</span>
                </span>

                {sloganRight && (
                  <span className="hidden lg:inline-flex items-center rounded-full border border-white/10 bg-white/[0.035] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-200">
                    {sloganRight}
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex shrink-0 items-center gap-6 text-sm text-slate-300">
              {rightSlot ?? (
                <>
                  <Link href="/hub" className="transition hover:text-white">
                    Hub
                  </Link>
                  <Link href="/terms" className="transition hover:text-white">
                    Terms
                  </Link>
                  <Link
                    href="/hub"
                    className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-slate-200"
                  >
                    Enter today&apos;s XPOT →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PREMIUM LINE */}
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
