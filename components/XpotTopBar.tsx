// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';
import XpotSignInModal from '@/components/XpotSignInModal';

export default function XpotTopBar() {
  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
        {/* LEFT: LOGO */}
        <Link href="/" className="flex items-center">
          <XpotLogoLottie
            width={420}
            height={110}
            className="cursor-pointer"
          />
        </Link>

        {/* RIGHT: AUTH ONLY (no theme toggle anymore) */}
        <div className="flex items-center gap-3">
          <XpotSignInModal />
        </div>
      </div>
    </header>
  );
}
