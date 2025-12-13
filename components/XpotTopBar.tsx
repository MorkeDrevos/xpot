// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';
import ThemeToggle from './ThemeToggle';
import XpotSignInModal from './XpotSignInModal';

export default function XpotTopBar() {
  return (
    <header className="border-b border-white/10 bg-black/75 backdrop-blur-md">
      <div className="mx-auto flex h-[104px] w-full max-w-[1440px] items-center justify-between px-4 sm:px-6">
        {/* LEFT: Logo aligned with page content */}
        <Link href="/" className="inline-flex items-center">
          {/* Tiny nudge to counter transparent padding in the PNG */}
          <div className="-ml-1 flex items-center leading-none">
            <XpotLogoLottie width={420} height={110} />
          </div>
        </Link>

        {/* RIGHT: Controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <XpotSignInModal />
        </div>
      </div>
    </header>
  );
}
