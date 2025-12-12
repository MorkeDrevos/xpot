'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lottie from 'lottie-react';

// bundled JSON (no fetch)
import animationData from '@/app/animations/xpot_logo_loop.json';

type XpotLogoLottieProps = {
  className?: string;

  // If provided, we lock the box size (recommended for stable headers)
  width?: number;
  height?: number;

  loop?: boolean;
  autoplay?: boolean;
};

export default function XpotLogoLottie({
  className = '',
  width,
  height,
  loop = true,
  autoplay = true,
}: XpotLogoLottieProps) {
  const [failed, setFailed] = useState(false);

  // default “header-safe” size if none passed
  const w = width ?? 132;
  const h = height ?? 36;

  if (failed) {
    return (
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={w}
        height={h}
        priority
        className={className}
      />
    );
  }

  return (
    <div
      className={['relative inline-block select-none', className].join(' ')}
      style={{
        width: w,
        height: h,
        minWidth: w,
        minHeight: h,
      }}
      aria-label="XPOT"
    >
      <Lottie
        animationData={animationData as any}
        loop={loop}
        autoplay={autoplay}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
        style={{ width: '100%', height: '100%' }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
