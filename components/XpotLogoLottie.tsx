// components/XpotLogoLottie.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [isBursting, setIsBursting] = useState(false);

  const triggerBurst = useCallback(() => {
    setBurstKey((k) => k + 1);
    setIsBursting(true);
    window.setTimeout(() => setIsBursting(false), 1400); // roughly the sweep duration
  }, []);

  // Auto burst every 20s
  useEffect(() => {
    const i = window.setInterval(() => triggerBurst(), 20000);
    return () => window.clearInterval(i);
  }, [triggerBurst]);

  const lottieKey = useMemo(
    () => `xpot-logo-${width}x${height}-${mode}-${burstKey}`,
    [width, height, mode, burstKey]
  );

  // Make shimmer VERY readable on the logo (premium specular)
  const overlayOpacity = mode === 'full' ? (isHovering ? 1 : 0.95) : 0.7;

  // Stronger “premium shine” look
  const overlayFilter =
    mode === 'full'
      ? isHovering
        ? 'contrast(1.65) brightness(1.55) saturate(1.25)'
        : 'contrast(1.45) brightness(1.35) saturate(1.18)'
      : 'contrast(1.25) brightness(1.15) saturate(1.08)';

  return (
    <div
      className={['relative select-none overflow-hidden', className].join(' ')}
      style={{ width, height, minWidth: width, minHeight: height }}
      aria-label="XPOT"
      role="img"
      onMouseEnter={() => {
        setIsHovering(true);
        triggerBurst();
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

      {/* Lottie shimmer overlay (masked to logo pixels) */}
      {!failed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: overlayOpacity,
            // Color dodge reads like real specular highlight (more visible than screen)
            mixBlendMode: 'color-dodge',
            transform: 'translateZ(0)',
            willChange: 'transform, opacity',
            filter: overlayFilter,

            // Mask overlay to logo alpha only
            WebkitMaskImage: 'url(/img/xpot-logo-light.png)',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskImage: 'url(/img/xpot-logo-light.png)',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskSize: 'contain',
          }}
        >
          <Lottie
            key={lottieKey}
            animationData={animationData as any}
            loop={false}
            autoplay
            renderer="svg"
            rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
            style={{ width: '100%', height: '100%' }}
            onDataFailed={() => setFailed(true)}
          />
        </div>
      )}

      {/* Extra premium “thin specular band” on burst/hover (masked to logo pixels) */}
      {(isBursting || isHovering) && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: isHovering ? 0.55 : 0.35,
            mixBlendMode: 'color-dodge',
            filter: 'contrast(1.5) brightness(1.55) saturate(1.25)',
            // moving band look without JS animation - looks like a clean highlight
            background:
              'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.0) 38%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.0) 62%, transparent 100%)',
            // Keep it inside the logo only
            WebkitMaskImage: 'url(/img/xpot-logo-light.png)',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskImage: 'url(/img/xpot-logo-light.png)',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskSize: 'contain',
          }}
        />
      )}
    </div>
  );
}
