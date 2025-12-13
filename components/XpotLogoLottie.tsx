// components/XpotLogoLottie.tsx
'use client';

import { useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import animationData from '@/app/animations/xpot_logo_loop.json';

type Props = {
  className?: string;
};

export default function XpotLogoLottie({ className = '' }: Props) {
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    if (!lottieRef.current) return;

    lottieRef.current.play();

    const interval = setInterval(() => {
      lottieRef.current?.goToAndPlay(0, true);
    }, 20000); // premium cadence

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex items-center ${className}`}
      style={{
        height: 64,        // 🔥 THIS is the key
        width: 300,
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        autoplay={false}
        loop={false}
        style={{
          width: '100%',
          height: '100%',
          transform: 'scale(1.35)',      // visual authority
          transformOrigin: 'left center',
          filter: 'drop-shadow(0 0 12px rgba(120,180,255,0.35))', // contrast
        }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid meet',
        }}
      />
    </div>
  );
}
