'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

type XpotTopBarProps = {
  logoHref?: string;
  rightSlot?: ReactNode;
  maxWidthClassName?: string; // must match XpotPageShell
};

export default function XpotTopBar({
  logoHref = '/',
  rightSlot,
  maxWidthClassName = 'max-w-[1440px]',
}: XpotTopBarProps) {
  // Respect PreLaunchBanner height if present
  const top =
    typeof window !== 'undefined'
      ? 'var(--xpot-banner-h, 56px)'
      : '56px';

  return (
    <header
      className="fixed inset-x-0 z-[60] w-full"
      style={{ top }}
    >
      <div className="border-b border-white/5 bg-black/70 backdrop-blur-md">
        {/* IMPORTANT: exact same container + padding as XpotPageShell */}
        <div
          className={[
            'mx-auto w-full',
            maxWidthClassName,
            'px-4 sm:px-6',
          ].join(' ')}
        >
          <div className="flex h-[80px] items-center justify-between gap-6">
            {/* LEFT */}
            <div className="flex min-w-0 items-center gap-4">
              <Link
                href={logoHref}
                className="flex items-center gap-3 shrink-0"
              >
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={260}
                  height={110}
                  priority
                  className="h-[96px] w-auto object-contain"
                />
              </Link>

              {/* Subtle protocol pill */}
              <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/5 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-emerald-100/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                THE X-POWERED REWARD PROTOCOL
              </span>
            </div>

            {/* RIGHT */}
            <div className="flex shrink-0 items-center gap-4">
              {rightSlot}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
