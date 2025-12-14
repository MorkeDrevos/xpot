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

  // Must match XpotPageShell defaults
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
  // If --xpot-banner-h is missing, fall back to 56px so the bar never hides under the purple banner.
  const top = hasBanner ? 'calc(var(--xpot-banner-h, 56px))' : '0px';

  return (
    <header className="fixed inset-x-0 z-[60] w-full" style={{ top }}>
      {/* Bar */}
      <div className="border-b border-white/5 bg-black/75 backdrop-blur-md">
        {/* IMPORTANT: same container + same padding as XpotPageShell */}
        <div className={['mx-auto w-full', maxWidthClassName, 'px-4 sm:px-6'].join(' ')}>
          {/* Taller bar so 100px logo is visible but feels less “off” */}
          <div className="flex h-[96px] items-center justify-between gap-6">
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

              {/* Pills */}
              <div className="hidden sm:flex min-w-0 items-center gap-3">
                {/* Make this less prominent */}
                <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-slate-200/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
                  <span className="truncate">{pillText}</span>
                </span>

                {sloganRight ? (
                  <span className="hidden lg:inline-flex items-center rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-100/90">
                    <span className="mr-2 h-2 w-2 rounded-full bg-emerald-400/90" />
                    {sloganRight}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Right */}
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

      {/* Animated premium line */}
      <div className="xpot-animated-line" />
    </header>
  );
}
