// components/XpotLogoLottie.tsx
'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Lottie from 'lottie-react';

import animationData from '@/app/animations/xpot_logo_loop.json';

type XpotLogoLottieProps = {
  className?: string;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
  mode?: 'full' | 'shimmer';
};

export default function XpotLogoLottie({
  className = '',
  width = 420,
  height = 120,
  loop = true,
  autoplay = true,
  mode = 'full',
}: XpotLogoLottieProps) {
  const [failed, setFailed] = useState(false);

  const lottieKey = useMemo(
    () => `xpot-logo-${width}x${height}`,
    [width, height]
  );

  const overlayOpacity = mode === 'full' ? 0.95 : 0.6;

  return (
    <div
      className={['relative select-none', className].join(' ')}
      style={{ width, height, minWidth: width, minHeight: height }}
      aria-label="XPOT"
      role="img"
    >
      {/* Base logo – always visible */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          filter:
            'drop-shadow(0 20px 44px rgba(0,0,0,0.75)) drop-shadow(0 0 46px rgba(56,189,248,0.35))',
        }}
      />

      {/* Animated sweep overlay */}
      {!failed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: overlayOpacity,
            mixBlendMode: 'screen',
            transform: 'translateZ(0)',
            willChange: 'transform, opacity',
          }}
        >
          <Lottie
            key={lottieKey}
            animationData={animationData as any}
            loop={loop}
            autoplay={autoplay}
            style={{ width: '100%', height: '100%' }}
            onDataFailed={() => setFailed(true)}
          />
        </div>
      )}
    </div>
  );
}
