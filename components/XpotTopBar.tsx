// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';
import ThemeToggle from './ThemeToggle';
import XpotSignInModal from './XpotSignInModal';

export default function XpotTopBar() {
  return (
    <header className="relative border-b border-white/10 bg-black/75 backdrop-blur-md">
      {/* Fixed header height */}
      <div className="mx-auto relative h-[132px] max-w-[1440px] px-4 sm:px-6">
        {/* LOGO – visually centered in black bar */}
        <Link
          href="/"
          className="absolute left-4 sm:left-6 top-[52%] -translate-y-1/2"
        >
          <XpotLogoLottie
            width={520}
            height={150}
            mode="full"
          />
        </Link>

        {/* RIGHT CONTROLS */}
        <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
          <ThemeToggle />
          <XpotSignInModal />
        </div>
      </div>
    </header>
  );
}
