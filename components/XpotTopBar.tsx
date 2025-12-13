'use client';

import Link from 'next/link';
import Image from 'next/image';

type XpotTopBarProps = {
  slogan?: string;
};

export default function XpotTopBar({
  slogan = 'THE X-POWERED REWARD POOL',
}: XpotTopBarProps) {
  return (
    <header className="relative z-50 w-full">
      {/* Top bar content */}
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between px-6">
        {/* Left: Logo + slogan */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              width={140}
              height={40}
              priority
              className="h-[40px] w-auto"
            />
          </Link>

          <span className="xpot-slogan-pill">
            {slogan}
          </span>
        </div>

        {/* Right: Nav */}
        <nav className="flex items-center gap-6 text-sm text-slate-300">
          <Link href="/dashboard" className="hover:text-white transition">
            Dashboard
          </Link>
          <Link href="/terms" className="hover:text-white transition">
            Terms
          </Link>
          <Link
            href="/enter"
            className="rounded-full bg-white px-4 py-2 font-semibold text-black hover:bg-slate-200 transition"
          >
            Enter today&apos;s XPOT →
          </Link>
        </nav>
      </div>

      {/* Animated premium line */}
      <div className="xpot-animated-line" />
    </header>
  );
}
