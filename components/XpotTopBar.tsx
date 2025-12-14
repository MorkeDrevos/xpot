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
          <div className="flex h-[76px] items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-6">
              <Link href={logoHref} className="flex items-center gap-3">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={190}
                  height={56}
                  priority
                  className="h-[56px] w-auto"
                />
              </Link>

              {showSlogan && (
                <div className="hidden sm:flex flex-col gap-1">
                  {/* Primary badge */}
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1 text-[11px] font-semibold tracking-wide text-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    THE X-POWERED REWARD POOL
                  </span>

                  {/* Core slogan */}
                  <span className="xpot-core-slogan">
                    One protocol. One identity. One daily XPOT draw.
                  </span>
                </div>
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

      {/* Animated green premium line */}
      <div className="xpot-animated-line" />
    </header>
  );
}
