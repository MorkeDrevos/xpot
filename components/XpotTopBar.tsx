// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';
import ThemeToggle from './ThemeToggle';
import XpotSignInModal from './XpotSignInModal';

export default function XpotTopBar() {
  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          {/* Logo wrapper controls perceived size + premium effects */}
          <div className="relative">
            {/* Soft glow */}
            <div className="pointer-events-none absolute -inset-3 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-violet-400/15 to-fuchsia-400/20 blur-xl opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Actual logo */}
            <div className="relative transition-transform duration-300 group-hover:-translate-y-[1px]">
              <XpotLogoLottie
                className="cursor-pointer select-none"
                // Bigger + responsive: mobile vs desktop
                width={180}
                height={50}
              />
            </div>
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
