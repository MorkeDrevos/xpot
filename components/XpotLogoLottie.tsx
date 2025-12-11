// components/XpotLogoLottie.tsx
'use client';

import Lottie from 'lottie-react';
import animationData from '@/app/animations/xpot_nebula_pulse.json';

type XpotLogoLottieProps = {
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
};

export default function XpotLogoLottie({
  className = 'h-10 w-10',
  loop = true,
  autoplay = true,
}: XpotLogoLottieProps) {
  return (
    <div className={className}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
