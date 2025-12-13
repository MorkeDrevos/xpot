// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

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

  // Logo sizing
  logoWidth?: number; // default 220
  logoHeight?: number; // default 64
};

export default function XpotTopBar({
  logoHref = '/',
  pillText = 'THE X-POWERED REWARD POOL',
  rightSlot,
  hasBanner = true,
  maxWidthClassName = 'max-w-[1440px]',
  logoWidth = 220,
  logoHeight = 64,
}: XpotTopBarProps) {
  const top = hasBanner ? 'var(--xpot-banner-h)' : '0px';

  return (
    <header className="fixed inset-x-0 z-[50] w-full" style={{ top }}>
      <div className="relative border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className={`mx-auto flex items-center justify-between px-6 ${maxWidthClassName}`}>
          {/* Left */}
          <div className="flex items-center gap-4 py-4">
            <Link href={logoHref} className="inline-flex items-center">
              <Image
                src="/img/xpot-logo-light.png"
                alt="XPOT"
                width={logoWidth}
                height={logoHeight}
                priority
                className="h-[44px] w-auto sm:h-[52px]"
              />
            </Link>

            {pillText ? (
              <span className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-widest text-slate-200">
                {pillText}
              </span>
            ) : null}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 py-4">
            {rightSlot ?? null}
          </div>
        </div>
      </div>
    </header>
  );
}
