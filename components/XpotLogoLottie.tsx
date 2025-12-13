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
  // "full"   = stronger shimmer for top bar hero
  // "shimmer" = subtle shimmer for secondary places
  mode?: 'full' | 'shimmer';

  // 0..1 (overlay strength)
  shimmerOpacity?: number;

  // Base logo opacity (keep at 1 for crisp logo)
  baseOpacity?: number;
};

export default function XpotLogoLottie({
  className = '',
  width = 180,
  height = 50,
  loop = true,
  autoplay = true,
  mode = 'full',
  shimmerOpacity,
  baseOpacity = 1,
}: XpotLogoLottieProps) {
  const [failed, setFailed] = useState(false);

  // Only remount lottie when size/mode changes (avoids weird restarts)
  const lottieKey = useMemo(
    () => `xpot-logo-${width}x${height}-${mode}`,
    [width, height, mode]
  );

  // Default overlay strength
  const overlayOpacity =
    shimmerOpacity ?? (mode === 'full' ? 0.95 : 0.6);

  return (
    <div
      className={['relative select-none', className].join(' ')}
      style={{ width, height, minWidth: width, minHeight: height }}
      aria-label="XPOT"
      role="img"
    >
      {/* ALWAYS show the real logo base (your Lottie is only the sweep/glow overlay) */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className="absolute inset-0 h-full w-full object-contain"
        style={{ opacity: baseOpacity }}
      />

      {/* Lottie overlay (shimmer/sweep). If it fails, we still have the PNG. */}
      {!failed && (
        <div
          className="absolute inset-0"
          style={{
            opacity: overlayOpacity,
            pointerEvents: 'none',
            // This is what makes it look like a premium shine
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
