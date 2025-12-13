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

  // "full" = premium hero shimmer
  // "shimmer" = subtle
  mode?: 'full' | 'shimmer';
};

export default function XpotLogoLottie({
  className = '',
  width = 520,
  height = 150,
  mode = 'full',
}: XpotLogoLottieProps) {
  const [failed, setFailed] = useState(false);

  // Re-trigger animation periodically (luxury cadence)
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    // run once after mount and then every 10s
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

  const overlayOpacity = mode === 'full' ? 1 : 0.65;

  return (
    <div
      className={['relative select-none', className].join(' ')}
      style={{ width, height, minWidth: width, minHeight: height }}
      aria-label="XPOT"
      role="img"
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
            'drop-shadow(0 26px 54px rgba(0,0,0,0.80)) drop-shadow(0 0 62px rgba(56,189,248,0.42))',
        }}
      />

      {/* Premium "shine" overlay, masked to the logo bounds */}
      {!failed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: overlayOpacity,
            // Mask keeps shine inside the logo area
            WebkitMaskImage:
              'linear-gradient(#000, #000), radial-gradient(circle at center, #000 62%, transparent 80%)',
            WebkitMaskComposite: 'source-in',
            maskComposite: 'intersect' as any,
            mixBlendMode: 'screen',
            transform: 'translateZ(0)',
            willChange: 'transform, opacity',
          }}
        >
          <Lottie
            key={lottieKey}
            animationData={animationData as any}
            loop={false} // IMPORTANT: luxury burst, not constant
            autoplay
            style={{ width: '100%', height: '100%' }}
            onDataFailed={() => setFailed(true)}
          />
        </div>
      )}

      {/* Subtle constant micro-glow (premium breathing) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: mode === 'full' ? 0.12 : 0.08,
          filter: 'blur(18px)',
          background:
            'radial-gradient(circle at 30% 30%, rgba(56,189,248,0.35), transparent 55%), radial-gradient(circle at 80% 60%, rgba(168,85,247,0.25), transparent 55%)',
        }}
      />
    </div>
  );
}
