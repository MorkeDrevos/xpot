'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

type XpotTopBarProps = {
  rightSlot?: ReactNode;
  hasBanner?: boolean;
  maxWidthClassName?: string;
};

export default function XpotTopBar({
  rightSlot,
  hasBanner = true,
  maxWidthClassName = 'max-w-[1440px]',
}: XpotTopBarProps) {
  const topOffset = hasBanner ? 'var(--xpot-banner-h)' : '0px';

  return (
    <header
      className="fixed inset-x-0 z-[50] w-full bg-black/70 backdrop-blur-xl border-b border-white/5"
      style={{ top: topOffset }}
    >
      <div className={`mx-auto px-6 ${maxWidthClassName}`}>
        <div className="flex h-[72px] items-center justify-between">
          {/* LEFT: LOGO + SLOGAN */}
          <div className="flex items-center gap-4">
            {/* BIGGER LOGO */}
            <Link href="/" className="flex items-center">
              <Image
                src="/img/xpot-logo-light.png"
                alt="XPOT"
                width={180}
                height={48}
                priority
                className="h-[44px] w-auto"
              />
            </Link>

            {/* SLOGAN PILL */}
            <span className="xpot-slogan-pill">
              THE X-POWERED REWARD POOL
            </span>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-6">
            {rightSlot}
          </div>
        </div>
      </div>

      {/* ANIMATED GREEN LINE */}
      <div className="xpot-animated-line" />
    </header>
  );
}
