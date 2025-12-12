// components/XpotLogoLottie.tsx
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
  // Bigger default (your PNG likely has padding, so this fixes “tiny”)
  const w = width ?? 240;
  const h = height ?? 64;

  const [lottieFailed, setLottieFailed] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);

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
      {/* Always-visible PNG base */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={w}
        height={h}
        priority
        className="block h-full w-full object-cover"
      />

      {/* Lottie overlay (fades in only after it actually renders frames) */}
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
            rendererSettings={{
              // Fill the box (prevents “small inside big box”)
              preserveAspectRatio: 'xMidYMid slice',
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}
    </div>
  );
}
