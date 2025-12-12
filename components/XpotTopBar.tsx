// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';
import ThemeToggle from './ThemeToggle';
import XpotSignInModal from './XpotSignInModal';

export default function XpotTopBar() {
  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center">
          {/* Reserve a bigger slot so it never renders tiny */}
          <div className="flex items-center">
            {/* Mobile */}
            <div className="block sm:hidden">
              <XpotLogoLottie width={170} height={44} className="cursor-pointer" />
            </div>

            {/* Desktop */}
            <div className="hidden sm:block">
              <XpotLogoLottie width={220} height={56} className="cursor-pointer" />
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <XpotSignInModal />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
