// components/XpotLogoLottie.tsx
'use client';

import Lottie from 'lottie-react';
import animationData from '@/app/animations/xpot_logo_loop.json';

export type XpotLogoLottieProps = {
  className?: string;
  width?: number;
  height?: number;
};

export default function XpotLogoLottie({
  className,
  width,
  height,
}: XpotLogoLottieProps) {
  const style =
    width || height ? { width: width ?? 'auto', height: height ?? 'auto' } : undefined;

  return (
    <div className={className} style={style}>
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
