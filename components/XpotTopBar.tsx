'use client';

import Link from 'next/link';
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
};

export default function XpotTopBar({
  logoHref = '/',
  pillText = 'THE X-POWERED REWARD POOL',
  rightSlot,
  hasBanner = true,
  maxWidthClassName = 'max-w-[1440px]',
}: XpotTopBarProps) {
  const top = hasBanner ? 'var(--xpot-banner-h)' : '0px';

  return (
    <header className="fixed inset-x-0 z-[50] w-full" style={{ top }}>
      <div className="relative border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className={`mx-auto w-full px-6 ${maxWidthClassName}`}>
          <div className="flex h-[72px] items-center justify-between">
            {/* LEFT: logo + pill */}
            <div className="flex items-center gap-3">
              <Link href={logoHref} className="inline-flex items-center">
                {/* SIZE: adjust h-[44px] to h-[48px] if you want taller */}
                <XpotLogoLottie
                  className="h-[44px]"
                  burstEveryMs={20000}
                  idleOpacity={0.95}
                />
              </Link>

              {pillText ? (
                <span className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-200">
                  {pillText}
                </span>
              ) : null}
            </div>

            {/* RIGHT: your page-specific slot (Sign in, buttons, etc) */}
            <div className="flex items-center gap-3">
              {rightSlot ? rightSlot : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
