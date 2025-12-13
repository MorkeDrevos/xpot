// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';

type XpotTopBarProps = {
  logoHref?: string;
  showSlogan?: boolean;
};

export default function XpotTopBar({
  logoHref = '/',
  showSlogan = true,
}: XpotTopBarProps) {
  return (
    <header className="relative z-50 w-full">
      {/* Top bar */}
      <div className="bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex h-[64px] items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              <Link href={logoHref} className="flex items-center gap-3">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={120}
                  height={36}
                  priority
                  className="h-[36px] w-auto"
                />
              </Link>

              {showSlogan && (
                <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-[11px] font-semibold tracking-wide text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  THE X-POWERED REWARD PROTOCOL
                </span>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-6 text-sm text-slate-300">
              <Link href="/hub" className="hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/terms" className="hover:text-white transition">
                Terms
              </Link>
              <Link
                href="/hub"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-200 transition"
              >
                Enter today’s XPOT
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Animated premium line */}
      <div className="xpot-animated-line" />
    </header>
  );
}
