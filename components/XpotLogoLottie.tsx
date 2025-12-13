// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';
import ThemeToggle from './ThemeToggle';
import XpotSignInModal from './XpotSignInModal';

export default function XpotTopBar() {
  return (
    <header className="relative border-b border-white/10 bg-black/75 backdrop-blur-md">
      <div className="mx-auto flex h-[110px] max-w-[1440px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="relative flex items-center">
          {/* Banner-height logo */}
          <div className="relative -mb-[28px]">
            <XpotLogoLottie
              width={420}
              height={120}
              mode="full"
            />
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <XpotSignInModal />
        </div>
      </div>
    </header>
  );
}
