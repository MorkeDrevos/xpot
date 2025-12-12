// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';
import ThemeToggle from './ThemeToggle';
import XpotSignInModal from './XpotSignInModal';

export default function XpotTopBar() {
  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          {/* Bigger + responsive, still locked aspect (no squish) */}
          <span className="block">
            <span className="hidden sm:block">
              <XpotLogoLottie className="cursor-pointer" width={180} height={48} />
            </span>
            <span className="block sm:hidden">
              <XpotLogoLottie className="cursor-pointer" width={148} height={40} />
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <XpotSignInModal />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
