// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';
import ThemeToggle from './ThemeToggle';
import XpotSignInModal from './XpotSignInModal';

export default function XpotTopBar() {
  return (
    <header className="relative border-b border-white/10 bg-black/75 backdrop-blur-md">
      {/* Header height intentionally tall for premium spacing */}
      <div className="mx-auto relative h-[120px] max-w-[1440px] px-6">
        {/* LOGO — locked to nav grid, not floating */}
        <Link
          href="/"
          className="
            absolute
            left-6
            top-1/2
            -translate-y-1/2
            flex
            items-center
          "
        >
          <XpotLogoLottie
            width={480}
            height={130}
            mode="full"
          />
        </Link>

        {/* RIGHT CONTROLS — perfectly centered */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
          <ThemeToggle />
          <XpotSignInModal />
        </div>
      </div>
    </header>
  );
}
