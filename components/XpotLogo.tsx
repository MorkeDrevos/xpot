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
  tone?: 'default' | 'gold'; // NEW
};

export default function XpotLogo({
  variant = 'light',
  width,
  height,
  className = '',
  priority = false,
  tone = 'default',
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

  // Static assets (served from /public/img)
  const src =
    variant === 'dark'
      ? '/img/xpot-black.png'
      : variant === 'mark'
      ? '/img/xpot-mark.png'
      : '/img/xpot-logo-light.png';

  /**
   * IMPORTANT:
   * The mark must be visually larger than its raw pixel size,
   * otherwise it looks smaller than the blue icon.
   */
  const w = width ?? (variant === 'mark' ? 24 : 180);
  const h = height ?? (variant === 'mark' ? 24 : 50);

  const goldFilter =
    tone === 'gold'
      ? 'sepia(1) saturate(2.3) hue-rotate(350deg) brightness(0.98) contrast(1.1)'
      : undefined;

  return (
    <Image
      src={src}
      alt="XPOT"
      width={w}
      height={h}
      priority={priority}
      className={className}
      style={{
        filter: goldFilter,
      }}
    />
  );
}
