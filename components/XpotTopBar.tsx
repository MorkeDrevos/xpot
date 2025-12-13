'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';

type XpotTopBarProps = {
  logoHref?: string;
};

export default function XpotTopBar({
  logoHref = '/',
}: XpotTopBarProps) {
  return (
    <header className="relative z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6">
        {/* LEFT — XPOT LOGO */}
        <Link
          href={logoHref}
          aria-label="XPOT Home"
          className="flex items-center"
        >
          <XpotLogoLottie
            width={220}
            height={60}
            className="select-none"
          />
        </Link>

        {/* RIGHT — AUTH ONLY */}
        <div className="flex items-center text-sm text-white/70">
          <span className="cursor-pointer transition hover:text-white">
            Sign in
          </span>
        </div>
      </div>
    </header>
  );
}
