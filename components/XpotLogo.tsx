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
  tone?: 'default' | 'gold';
};

export default function XpotLogo({
  variant = 'light',
  width,
  height,
  className,
  priority = false,
  tone = 'default',
}: XpotLogoProps) {
  if (variant === 'animated') {
    return <XpotLogoLottie className={className} width={width ?? 180} height={height ?? 50} />;
  }

  const src =
    variant === 'dark'
      ? '/img/xpot-black.png'
      : variant === 'mark'
        ? tone === 'gold'
          ? '/img/xpot-mark-gold.png'
          : '/img/xpot-mark.png'
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
