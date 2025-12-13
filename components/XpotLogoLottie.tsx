// components/XpotLogoLottie.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
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
  const [isHovering, setIsHovering] = useState(false);

  // Trigger a single shimmer burst
  const triggerBurst = useCallback(() => {
    setBurstKey((k) => k + 1);
  }, []);

  // Auto-burst every 20s (luxury cadence)
  useEffect(() => {
    const interval = setInterval(() => {
      triggerBurst();
    }, 20000);

    return () => clearInterval(interval);
  }, [triggerBurst]);

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
      onMouseEnter={() => {
        setIsHovering(true);
        triggerBurst(); // immediate burst on hover
      }}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Base logo (always visible) */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          filter:
            'drop-shadow(0 14px 28px rgba(0,0,0,0.75)) drop-shadow(0 0 22px rgba(56,189,248,0.22))',
        }}
      />

      {/* Shimmer overlay – masked to logo pixels only */}
      {!failed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: overlayOpacity,
            mixBlendMode: 'screen',
            transform: 'translateZ(0)',
            willChange: 'transform, opacity',

            // Mask shimmer to the logo alpha
            WebkitMaskImage: 'url(/img/xpot-logo-light.png)',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskImage: 'url(/img/xpot-logo-light.png)',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskSize: 'contain',

            // Make highlight read clearly on the logo
            filter:
              mode === 'full'
                ? 'contrast(1.25) brightness(1.18)'
                : 'contrast(1.15) brightness(1.08)',
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
