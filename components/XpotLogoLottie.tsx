// components/XpotLogoLottie.tsx
'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Lottie from 'lottie-react';

// Bundled animation (NO fetch)
import animationData from '@/app/animations/xpot_logo_loop.json';

type XpotLogoLottieProps = {
  className?: string;

  // Box size (keeps the logo from ever “squishing”)
  width?: number;
  height?: number;

  loop?: boolean;
  autoplay?: boolean;

  // Visual tuning
  // "full" = the animation is the hero (top bar)
  // "shimmer" = subtle overlay on top of PNG
  mode?: 'full' | 'shimmer';

  // 0..1 (only applies to shimmer mode)
  shimmerOpacity?: number;

  // Optional: crispness when scaling
  quality?: 'normal' | 'high';
};

export default function XpotLogoLottie({
  className = '',
  width = 180,
  height = 50,
  loop = true,
  autoplay = true,
  mode = 'full',
  shimmerOpacity = 0.7,
  quality = 'high',
}: XpotLogoLottieProps) {
  const [failed, setFailed] = useState(false);

  // Only remount lottie when size changes (avoids weird restarts)
  const lottieKey = useMemo(
    () => `xpot-logo-${width}x${height}-${mode}`,
    [width, height, mode]
  );

  const showPngBase = mode === 'shimmer' || failed;

  return (
    <div
      className={['relative select-none', className].join(' ')}
      style={{ width, height, minWidth: width, minHeight: height }}
      aria-label="XPOT"
      role="img"
    >
      {/* PNG base only when needed */}
      {showPngBase && (
        <Image
          src="/img/xpot-logo-light.png"
          alt="XPOT"
          width={width}
          height={height}
          priority
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}

      {/* Lottie */}
      {!failed && (
        <div
          className="absolute inset-0"
          style={{
            opacity: mode === 'shimmer' ? shimmerOpacity : 1,
            pointerEvents: 'none',
            mixBlendMode: mode === 'shimmer' ? 'screen' : 'normal',
            // Helps SVG look crisp when scaled
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
            // If JSON can't be parsed/loaded, fall back to PNG
            onDataFailed={() => setFailed(true)}
            // Slightly better quality at larger sizes
            rendererSettings={
              quality === 'high'
                ? { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true }
                : { preserveAspectRatio: 'xMidYMid meet' }
            }
          />
        </div>
      )}
    </div>
  );
}
