// components/XpotTopBar.tsx
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
  // IMPORTANT:
  // If --xpot-banner-h is missing, we fall back to 56px so the bar never hides under the purple banner.
  const top = hasBanner ? 'calc(var(--xpot-banner-h, 56px))' : '0px';

  return (
    <header className="fixed inset-x-0 z-[60] w-full" style={{ top }}>
      {/* Bar */}
      <div className="bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className={`mx-auto ${maxWidthClassName} px-6`}>
          {/* Tall bar so 100px logo is visible */}
          <div className="flex h-[112px] items-center justify-between gap-6">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-5">
              <Link href={logoHref} className="flex items-center gap-3 shrink-0">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={260}
                  height={110}
                  priority
                  className="h-[100px] w-auto object-contain"
                />
              </Link>

              <div className="hidden sm:flex min-w-0 items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate">{pillText}</span>
                </span>

                {sloganRight ? (
                  <span className="hidden lg:inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-200">
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

      {/* Animated premium line */}
      <div className="xpot-animated-line" />
    </header>
  );
}
