// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

import ThemeToggle from '@/components/ThemeToggle';
import XpotSignInModal from '@/components/XpotSignInModal';

type XpotTopBarProps = {
  logoHref?: string;
  rightSlot?: ReactNode;
  showSignIn?: boolean;
  showThemeToggle?: boolean;
};

export default function XpotTopBar({
  logoHref = '/',
  rightSlot,
  showSignIn = true,
  showThemeToggle = true,
}: XpotTopBarProps) {
  return (
    <header className="relative z-30">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <div className="flex h-[76px] items-center justify-between">
          <Link href={logoHref} className="inline-flex items-center gap-3">
            <Image
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              width={220}
              height={60}
              priority
              className="h-[44px] w-auto"
            />
          </Link>

          <div className="flex items-center gap-2">
            {rightSlot}

            {showSignIn && <XpotSignInModal />}
            {showThemeToggle && <ThemeToggle />}
          </div>
        </div>
      </div>
    </header>
  );
}
