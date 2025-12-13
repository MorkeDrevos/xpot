// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';

export default function XpotTopBar() {
  return (
    <header className="border-b border-white/10 bg-black/70 backdrop-blur">
      <div
        className="
          mx-auto
          flex
          h-[88px]
          max-w-[1440px]
          items-center
          justify-between
          px-6
        "
      >
        <Link href="/" className="flex items-center">
          <XpotLogoLottie />
        </Link>

        <div className="text-sm text-slate-300">
          Sign in
        </div>
      </div>
    </header>
  );
}
