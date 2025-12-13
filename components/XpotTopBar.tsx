// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

import XpotLogoLottie from '@/components/XpotLogoLottie';

type XpotTopBarProps = {
  logoHref?: string;

  // Left pill text - unique per page
  pillText?: string;

  // Right side - unique per page (menu links, buttons, status pills etc)
  rightSlot?: ReactNode;

  // Banner stacking
  hasBanner?: boolean;

  // Keep aligned with page container
  maxWidthClassName?: string; // default: max-w-[1440px]

  // Optional: show animated lottie logo instead of static image
  useAnimatedLogo?: boolean;

  // Optional slogan on the right (text only)
  sloganRight?: string;
};

export default function XpotTopBar({
  logoHref = '/',
  pillText = 'THE X-POWERED REWARD POOL',
  rightSlot,
  hasBanner = true,
  maxWidthClassName = 'max-w-[1440px]',
  useAnimatedLogo = false,
  sloganRight = 'THE X-POWERED REWARD POOL',
}: XpotTopBarProps) {
  const top = hasBanner ? 'var(--xpot-banner-h)' : '0px';

  return (
    <header className="fixed inset-x-0 z-[50] w-full" style={{ top }}>
      <div className="relative">
        {/* subtle top separator line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

        <div className="mx-auto w-full px-4 sm:px-6" style={{ maxWidth: 'var(--xpot-page-max, 1440px)' }}>
          <div className={['flex h-[76px] items-center justify-between', maxWidthClassName].filter(Boolean).join(' ')}>
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <Link
                href={logoHref}
                className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2 shadow-sm backdrop-blur hover:bg-black/20 transition"
                aria-label="XPOT Home"
              >
                {/* LOGO */}
                {useAnimatedLogo ? (
                  <XpotLogoLottie
                    className="h-[42px]"
                    burstEveryMs={20000}
                    idleOpacity={0.95}
                    flashDurationMs={900}
                  />
                ) : (
                  <Image
                    src="/img/xpot-logo-light.png"
                    alt="XPOT"
                    width={180}
                    height={48}
                    priority
                    className="h-[42px] w-auto"
                  />
                )}

                {/* PILL */}
                {pillText ? (
                  <span className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-200/90">
                    {pillText}
                  </span>
                ) : null}
              </Link>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3">
              {/* slogan on the right */}
              {sloganRight ? (
                <span className="hidden md:inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-emerald-200">
                  {sloganRight}
                </span>
              ) : null}

              {rightSlot}
            </div>
          </div>
        </div>

        {/* subtle bottom separator line */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10" />
      </div>
    </header>
  );
}
