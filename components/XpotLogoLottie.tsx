'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';

import animationData from '@/app/animations/xpot_logo_loop.json';

type XpotLogoLottieProps = {
  className?: string;

  // sizing (used in multiple places)
  width?: number;
  height?: number;

  // premium cadence
  burstEveryMs?: number; // default 20s
  speed?: number; // default 0.85
  glow?: boolean; // default true
};

export default function XpotLogoLottie({
  className = '',
  width = 220,
  height = 64,
  burstEveryMs = 20000,
  speed = 0.85,
  glow = true,
}: XpotLogoLottieProps) {
  const lottieRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  // only remount if size changes
  const lottieKey = useMemo(
    () => `xpot-logo-${width}x${height}`,
    [width, height]
  );

  const playBurst = () => {
    const inst = lottieRef.current;
    if (!inst) return;

    try {
      inst.setSpeed(speed); // ✅ CORRECT WAY
      inst.stop();
      inst.goToAndPlay(0, true);
    } catch {
      // lottie instance quirks – ignore safely
    }
  };

  // auto burst (premium, slow)
  useEffect(() => {
    const id = setInterval(playBurst, burstEveryMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstEveryMs, lottieKey]);

  // hover burst
  useEffect(() => {
    if (hovered) playBurst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered]);

  return (
    <div
      className={`relative select-none ${className}`}
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="XPOT"
      role="img"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: 'scale(1.06)',
          transformOrigin: 'left center',
          filter: glow
            ? 'drop-shadow(0 0 14px rgba(120,180,255,0.28))'
            : undefined,
        }}
      >
        <Lottie
          key={lottieKey}
          lottieRef={lottieRef}
          animationData={animationData as any}
          autoplay={false}
          loop={false}
          style={{ width: '100%', height: '100%' }}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet',
          }}
        />
      </div>
    </div>
  );
}
