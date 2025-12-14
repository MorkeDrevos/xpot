'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

type XpotTopBarProps = {
  logoHref?: string;
  pillText?: string;
  rightSlot?: ReactNode;
  hasBanner?: boolean;
  maxWidthClassName?: string; // default: max-w-[1440px]
};

export default function XpotTopBar({
  logoHref = '/',
  pillText = 'THE X-POWERED REWARD PROTOCOL',
  rightSlot,
  hasBanner = true,
  maxWidthClassName = 'max-w-[1440px]',
}: XpotTopBarProps) {
  // Overlap by 1px to kill any seam/gap forever
  const top = hasBanner ? 'calc(var(--xpot-banner-h, 0px) - 1px)' : '0px';

  return (
    <header className="fixed inset-x-0 z-[50] w-full" style={{ top }}>
      <div className="border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <div className={`mx-auto ${maxWidthClassName} px-4`}>
          <div className="flex items-center justify-between py-4">
            {/* Left: logo + pill */}
            <div className="flex items-center gap-5">
              <Link href={logoHref} className="flex items-center gap-3">
                {/* Bigger logo (locked height) */}
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={260}
                  height={72}
                  priority
                  className="h-[64px] w-auto"
                />
              </Link>

              <span
                className="
                  hidden sm:inline-flex items-center gap-2
                  rounded-full border border-white/10 bg-white/5
                  px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]
                  text-white/75
                "
              >
                <span className="h-2 w-2 rounded-full bg-white/35" />
                {pillText}
              </span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">{rightSlot}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
