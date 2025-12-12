// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';
import ThemeToggle from '@/components/ThemeToggle';
import XpotSignInModal from '@/components/XpotSignInModal';

export default function XpotTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <XpotLogoLottie
            className="h-9 w-[132px] cursor-pointer select-none"
          />
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <XpotSignInModal />
        </div>
      </div>
    </header>
  );
}
