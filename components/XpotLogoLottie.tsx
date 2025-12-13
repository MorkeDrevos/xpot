'use client';

import { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';

import animationData from '@/app/animations/xpot_logo_loop.json';

export type XpotLogoLottieProps = {
  className?: string;
  burstEveryMs?: number;     // default 20000
  idleOpacity?: number;      // default 0.95
  flashDurationMs?: number;  // default 900
};

export default function XpotLogoLottie({
  className,
  burstEveryMs = 20000,
  idleOpacity = 0.95,
  flashDurationMs = 900,
}: XpotLogoLottieProps) {
  const lottieRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  const playDoubleFlash = () => {
    const anim = lottieRef.current;
    if (!anim) return;

    anim.goToAndPlay(0, true);
    setTimeout(() => anim.goToAndPlay(0, true), flashDurationMs);
  };

  useEffect(() => {
    const id = setInterval(() => {
      if (!hovered) playDoubleFlash();
    }, burstEveryMs);

    return () => clearInterval(id);
  }, [burstEveryMs, hovered]);

  return (
    <div
      className={[
        'inline-flex items-center transition-opacity duration-500',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ opacity: idleOpacity }}
      onMouseEnter={() => {
        setHovered(true);
        playDoubleFlash();
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        autoplay={false}
        loop={false}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true,
        }}
        style={{ height: '100%', width: 'auto' }}
      />
    </div>
  );
}
