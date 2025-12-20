// components/XpotLogo.tsx
'use client';

import Image from 'next/image';
import XpotLogoLottie from '@/components/XpotLogoLottie';

type XpotLogoProps = {
  variant?: 'light' | 'dark' | 'mark' | 'animated';
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export default function XpotLogo({
  variant = 'light',
  width,
  height,
  className,
  priority = false,
}: XpotLogoProps) {
  // Animated version
  if (variant === 'animated') {
    return (
      <XpotLogoLottie
        className={className}
        width={width ?? 180}
        height={height ?? 50}
      />
    );
  }

  // Static fallback (IMPORTANT: Next serves from /public, so src starts at /img/...)
  const src =
    variant === 'dark'
      ? '/img/xpot-black.png'
      : variant === 'mark'
      ? '/img/xpot-mark.png'
      : '/img/xpot-logo-light.png';

  const w = width ?? (variant === 'mark' ? 28 : 180);
  const h = height ?? (variant === 'mark' ? 28 : 50);

  return (
    <Image
      src={src}
      alt="XPOT"
      width={w}
      height={h}
      className={className}
      priority={priority}
    />
  );
}
