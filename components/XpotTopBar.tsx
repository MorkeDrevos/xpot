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
  const top = hasBanner ? 'var(--xpot-banner-h)' : '0px';

  return (
    <header
      className="fixed inset-x-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl"
      style={{ top }}
    >
      <div
        className={`mx-auto flex h-[72px] items-center justify-between px-6 ${maxWidthClassName}`}
      >
        {/* LEFT: XPOT wordmark */}
        <Link href="/" className="flex items-center">
          <Image
            src="/img/xpot-logo-light.png"   // ← horizontal logo
            alt="XPOT"
            width={180}
            height={48}
            priority
            className="h-[36px] w-auto opacity-95 hover:opacity-100 transition"
          />
        </Link>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {rightSlot}
        </div>
      </div>
    </header>
  );
}
