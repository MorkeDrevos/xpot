// components/XpotLogo.tsx
'use client';

import Image from 'next/image';
import XpotLogoLottie from './XpotLogoLottie';

type XpotLogoProps = {
  variant?: 'light' | 'dark' | 'mark' | 'animated';
  width?: number;
  height?: number;
  className?: string;
};

export default function XpotLogo({
  variant = 'light',
  width,
  height,
  className,
}: XpotLogoProps) {
  // 🔥 Animated version (admin / dashboard)
  if (variant === 'animated') {
    return (
      <XpotLogoLottie
        className={className ?? 'h-14 w-14'}
      />
    );
  }

  // Static fallback (marketing / public)
  let src = '/img/xpot-logo-light.png';

  if (variant === 'dark') src = '/img/xpot-black.png';
  if (variant === 'mark') src = '/img/xpot-mark.png';

  const w = width ?? (variant === 'mark' ? 28 : 140);
  const h = height ?? (variant === 'mark' ? 28 : 40);

  return (
    <Image
      src={src}
      alt="XPOT"
      width={w}
      height={h}
      className={className}
      priority
    />
  );
}
