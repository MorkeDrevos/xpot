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

  // Optional tone treatment (used for the vault gold badge)
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
  // Animated version
  if (variant === 'animated') {
    return <XpotLogoLottie className={className} width={width ?? 180} height={height ?? 50} />;
  }

  // Static fallback (served from /public)
  const src =
    variant === 'dark'
      ? '/img/xpot-black.png'
      : variant === 'mark'
        ? '/img/xpot-mark.png'
        : '/img/xpot-logo-light.png';

  const w = width ?? (variant === 'mark' ? 28 : 180);
  const h = height ?? (variant === 'mark' ? 28 : 50);

  const goldFilter =
    tone === 'gold' && variant === 'mark'
      ? // Warm gold tint + subtle glow (matches your VAULT_GOLD vibe)
        'sepia(1) saturate(2.2) hue-rotate(350deg) brightness(0.98) contrast(1.1) drop-shadow(0 0 10px rgba(201,162,74,0.18))'
      : undefined;

  return (
    <Image
      src={src}
      alt="XPOT"
      width={w}
      height={h}
      className={className}
      priority={priority}
      style={goldFilter ? { filter: goldFilter } : undefined}
    />
  );
}
