// components/XpotLogo.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';

export type XpotLogoProps = {
  href?: string;
  className?: string;

  // sizing
  size?: number;

  // animation controls (optional)
  burstEveryMs?: number; // default 20000
  idleOpacity?: number; // default 0.95

  // Optional label pill
  rightLabel?: string;
};

export default function XpotLogo({
  href = '/',
  className = '',
  size = 44, // slightly bigger default
  burstEveryMs = 20000,
  idleOpacity = 0.95,
  rightLabel,
}: XpotLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Link href={href} className="inline-flex items-center">
        <XpotLogoLottie
          size={size}
          burstEveryMs={burstEveryMs}
          idleOpacity={idleOpacity}
        />
      </Link>

      {rightLabel ? (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-200">
          {rightLabel}
        </span>
      ) : null}
    </div>
  );
}
