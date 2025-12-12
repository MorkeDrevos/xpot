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
  lottieOpacity?: number; // 0..1
};

export default function XpotLogoLottie({
  className = '',
  width = 132,
  height = 36,
  loop = true,
  autoplay = true,
  lottieOpacity = 0.75,
}: XpotLogoLottieProps) {
  const [failed, setFailed] = useState(false);

  // Prevent accidental remount loops
  const lottieKey = useMemo(() => `xpot-logo-${width}x${height}`, [width, height]);

  return (
    <div
      className={['relative select-none', className].join(' ')}
      style={{ width, height, minWidth: width, minHeight: height }}
      aria-label="XPOT"
      role="img"
    >
      {/* ALWAYS show premium PNG base (never blank, never “disappears”) */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className="absolute inset-0 h-full w-full object-contain"
      />

      {/* Lottie overlay (subtle premium shimmer). If it errors, we just hide it. */}
      {!failed && (
        <div
          className="absolute inset-0"
          style={{
            opacity: lottieOpacity,
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        >
          <Lottie
            key={lottieKey}
            animationData={animationData as any}
            loop={loop}
            autoplay={autoplay}
            renderer="svg"
            rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
            style={{ width: '100%', height: '100%' }}
            onError={() => setFailed(true)}
          />
        </div>
      )}
    </div>
  );
}
