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
      <div className="relative border-b border-white/10 bg-black/45 backdrop-blur-xl">
        <div className={`mx-auto w-full px-4 sm:px-6 ${maxWidthClassName}`}>
          <div className="flex h-[68px] items-center justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <Link
                href={logoHref}
                className="inline-flex items-center gap-2"
                aria-label="XPOT Home"
                title="XPOT"
              >
                {/* IMPORTANT: this is the “cannot disappear” logo */}
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={180}
                  height={56}
                  priority
                  className="h-[44px] w-auto opacity-100"
                />
              </Link>

              <span className="hidden sm:inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-200">
                {pillText}
              </span>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3">
              {rightSlot ?? null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
