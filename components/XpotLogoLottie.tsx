// components/XpotLogoLottie.tsx
'use client';

import { useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import animationData from '@/app/animations/xpot_logo_loop.json';

type XpotLogoLottieProps = {
  className?: string;
  width?: number;
  height?: number;
};

export default function XpotLogoLottie({
  className = '',
  width = 280,
  height = 72,
}: XpotLogoLottieProps) {
  const lottieRef = useRef<any>(null);

  // Only play on mount + every 20s (premium cadence)
  useEffect(() => {
    if (!lottieRef.current) return;

    lottieRef.current.play();

    const interval = setInterval(() => {
      lottieRef.current?.goToAndPlay(0, true);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={className}
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={false}
        autoplay={false}
        style={{
          width: '100%',
          height: '100%',
          transform: 'scale(1.25)', // 🔥 THIS IS THE SECRET
          transformOrigin: 'left center',
        }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid meet',
        }}
      />
    </div>
  );
}
