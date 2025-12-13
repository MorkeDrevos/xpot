'use client';

import { useEffect, useRef } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

// IMPORTANT: this file EXISTS (underscore, not hyphen)
import animationData from '@/app/animations/xpot_logo_loop.json';

type Props = {
  size?: number; // px
  className?: string;
};

export default function XpotLogoLottie({
  size = 34,
  className,
}: Props) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    const playDoubleFlash = async () => {
      if (!lottieRef.current) return;

      // First flash
      lottieRef.current.setSpeed(0.6); // slow = premium
      lottieRef.current.goToAndPlay(0, true);

      // Let it breathe
      await new Promise((r) => setTimeout(r, 650));

      // Second flash
      lottieRef.current.goToAndPlay(0, true);
    };

    // Initial subtle intro after mount
    const introTimeout = setTimeout(playDoubleFlash, 1200);

    // Repeat every 20s (as requested earlier)
    const interval = setInterval(playDoubleFlash, 20_000);

    return () => {
      clearTimeout(introTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="XPOT"
      title="XPOT"
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        autoplay={false}
        loop={false}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid meet',
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
