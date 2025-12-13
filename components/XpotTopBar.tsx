// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

type XpotTopBarProps = {
  logoHref?: string;
  rightSlot?: ReactNode;
  hasBanner?: boolean;
  maxWidthClassName?: string;
};

export default function XpotTopBar({
  logoHref = '/',
  rightSlot,
  hasBanner = true,
  maxWidthClassName = 'max-w-[1440px]',
}: XpotTopBarProps) {
  const top = hasBanner ? 'var(--xpot-banner-h)' : '0px';

  return (
    <header
      className="fixed inset-x-0 z-[50] w-full"
      style={{ top }}
    >
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div
          className={`mx-auto flex h-[72px] items-center justify-between px-6 ${maxWidthClassName}`}
        >
          {/* LEFT: LOGO */}
          <Link
            href={logoHref}
            className="flex items-center"
          >
            <Image
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              width={260}
              height={72}
              priority
              className="h-[56px] w-auto"
            />
          </Link>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {rightSlot ?? null}
          </div>
        </div>
      </div>
    </header>
  );
}
