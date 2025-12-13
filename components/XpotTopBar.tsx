// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';
import ThemeToggle from './ThemeToggle';
import XpotSignInModal from './XpotSignInModal';

export default function XpotTopBar() {
  return (
    <header className="border-b border-white/10 bg-black/75 backdrop-blur-md">
      <div className="mx-auto flex h-[104px] max-w-[1440px] items-center justify-between px-6">
        {/* LEFT: Logo aligned to grid */}
        <div className="flex items-center">
          <Link href="/" className="inline-flex items-center">
            {/* Prevent the logo from affecting vertical alignment */}
            <div className="flex items-center leading-none">
              <XpotLogoLottie width={460} height={120} />
            </div>
          </Link>
        </div>

        {/* RIGHT: Controls aligned */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <XpotSignInModal />
        </div>
      </div>
    </header>
  );
}
