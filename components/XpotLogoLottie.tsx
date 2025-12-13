// components/XpotLogoLottie.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Lottie from 'lottie-react';

import animationData from '@/app/animations/xpot_logo_loop.json';

type XpotLogoLottieProps = {
  className?: string;
  width?: number;
  height?: number;
  mode?: 'full' | 'shimmer';
};

export default function XpotLogoLottie({
  className = '',
  width = 520,
  height = 150,
  mode = 'full',
}: XpotLogoLottieProps) {
  const [failed, setFailed] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  // Luxury cadence: runs on mount then every 10s
  useEffect(() => {
    const t = setTimeout(() => setBurstKey((k) => k + 1), 600);
    const i = setInterval(() => setBurstKey((k) => k + 1), 10000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
  }, []);

  const lottieKey = useMemo(
    () => `xpot-logo-${width}x${height}-${mode}-${burstKey}`,
    [width, height, mode, burstKey]
  );

  const overlayOpacity = mode === 'full' ? 0.95 : 0.65;

  return (
    <div
      className={['relative select-none overflow-hidden', className].join(' ')}
      style={{ width, height, minWidth: width, minHeight: height }}
      aria-label="XPOT"
      role="img"
    >
      {/* Base logo */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          // tighter shadows so they don't brighten the purple banner above
          filter:
            'drop-shadow(0 14px 28px rgba(0,0,0,0.75)) drop-shadow(0 0 22px rgba(56,189,248,0.22))',
        }}
      />

      {/* Shimmer overlay: MASKED to the logo pixels (critical fix) */}
      {!failed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: overlayOpacity,
            mixBlendMode: 'screen',
            transform: 'translateZ(0)',
            willChange: 'transform, opacity',

            // Mask shimmer to logo alpha so it ONLY shows on the logo
            WebkitMaskImage: 'url(/img/xpot-logo-light.png)',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskImage: 'url(/img/xpot-logo-light.png)',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskSize: 'contain',

            // Make shimmer clearly visible (premium specular)
            filter: mode === 'full' ? 'contrast(1.25) brightness(1.18)' : 'contrast(1.15) brightness(1.08)',
          }}
        >
          <Lottie
            key={lottieKey}
            animationData={animationData as any}
            loop={false}
            autoplay
            style={{ width: '100%', height: '100%' }}
            onDataFailed={() => setFailed(true)}
          />
        </div>
      )}
    </div>
  );
}
