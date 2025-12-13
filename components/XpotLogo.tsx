// components/XpotLogo.tsx
'use client';

import Image from 'next/image';
import XpotLogoLottie from '@/components/XpotLogoLottie';

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

  // Static fallback
  let src = '/img/xpot-logo-light.png';
  if (variant === 'dark') src = '/img/xpot-black.png';
  if (variant === 'mark') src = '/img/xpot-mark.png';

  const w = width ?? (variant === 'mark' ? 28 : 180);
  const h = height ?? (variant === 'mark' ? 28 : 50);

  return <Image src={src} alt="XPOT" width={w} height={h} className={className} />;
}
