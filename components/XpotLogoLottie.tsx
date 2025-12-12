'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Lottie from 'lottie-react';

import animationData from '@/app/animations/xpot_logo_loop.json';

type XpotLogoLottieProps = {
  className?: string;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
};

export default function XpotLogoLottie({
  className = '',
  width,
  height,
  loop = true,
  autoplay = true,
}: XpotLogoLottieProps) {
  const w = width ?? 180;
  const h = height ?? 48;

  const [lottieFailed, setLottieFailed] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);

  // guard: only set once (avoid re-renders every frame)
  const onEnterFrame = useMemo(() => {
    let fired = false;
    return () => {
      if (!fired) {
        fired = true;
        setHasFrame(true);
      }
    };
  }, []);

  return (
    <div
      className={['relative inline-block select-none', className].join(' ')}
      style={{ width: w, height: h, minWidth: w, minHeight: h }}
      aria-label="XPOT"
    >
      {/* BASE LAYER: always visible, premium fallback */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={w}
        height={h}
        priority
        className="block h-full w-full object-contain opacity-95"
      />

      {/* TOP LAYER: Lottie fades in only after frames render */}
      {!lottieFailed && (
        <div
          className={[
            'absolute inset-0 transition-opacity duration-300',
            hasFrame ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        >
          <Lottie
            animationData={animationData as any}
            loop={loop}
            autoplay={autoplay}
            onEnterFrame={onEnterFrame as any}
            onError={() => setLottieFailed(true)}
            rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}
    </div>
  );
}
