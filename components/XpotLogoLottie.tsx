// components/XpotLogoLottie.tsx
'use client';

import Image from 'next/image';
import Lottie from 'lottie-react';

// Bundled animation (NO fetch, NO URL)
import animationData from '@/app/animations/xpot_logo_loop.json';

type XpotLogoLottieProps = {
  className?: string;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
};

export default function XpotLogoLottie({
  className = '',
  width = 132,
  height = 36,
  loop = true,
  autoplay = true,
}: XpotLogoLottieProps) {
  return (
    <div
      className={['relative select-none', className].join(' ')}
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height,
      }}
      aria-label="XPOT"
    >
      {/* Base logo - ALWAYS visible */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className="absolute inset-0 h-full w-full object-contain"
      />

      {/* Premium glow overlay */}
      <div className="absolute inset-0">
        <Lottie
          animationData={animationData as any}
          loop={loop}
          autoplay={autoplay}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet',
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
}
