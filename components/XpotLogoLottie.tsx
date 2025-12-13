// components/XpotLogo.tsx
'use client';

import Link from 'next/link';
import XpotLogoLottie from '@/components/XpotLogoLottie';

type XpotLogoProps = {
  href?: string;
  className?: string;

  // Single source of truth for sizing (no width/height anymore)
  size?: number;

  // Optional: show the “pill text” next to the logo (used in top bars)
  rightLabel?: string;
};

export default function XpotLogo({
  href = '/',
  className = '',
  size = 36,
  rightLabel,
}: XpotLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Link href={href} className="inline-flex items-center">
        <XpotLogoLottie size={size} />
      </Link>

      {rightLabel ? (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-200">
          {rightLabel}
        </span>
      ) : null}
    </div>
  );
}
