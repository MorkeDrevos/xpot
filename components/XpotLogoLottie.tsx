'use client';

import Image from 'next/image';
import Lottie from 'lottie-react';

// ✅ bundled JSON import (no fetch, no URL)
import animationData from '@/app/animations/xpot_nebula_pulse.json';

type Props = {
  className?: string;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
};

export default function XpotLogoLottie({
  className,
  width = 132,
  height = 36,
  loop = true,
  autoplay = true,
}: Props) {
  try {
    return (
      <div className={className} style={{ width, height }}>
        <Lottie
          animationData={animationData as any}
          loop={loop}
          autoplay={autoplay}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  } catch {
    return (
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className={className}
      />
    );
  }
}
