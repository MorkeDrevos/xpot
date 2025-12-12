// components/XpotLogoLottie.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Bundled JSON import (NO fetch)
import animationData from '@/app/animations/xpot_logo_loop.json';

type Props = {
  className?: string;
  width?: number;  // optional explicit px width
  height?: number; // optional explicit px height
  loop?: boolean;
  autoplay?: boolean;
};

const Lottie = dynamic(() => import('lottie-react').then((m) => m.default), {
  ssr: false,
});

export default function XpotLogoLottie({
  className = '',
  width,
  height,
  loop = true,
  autoplay = true,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (typeof width === 'number') style.width = width;
    if (typeof height === 'number') style.height = height;
    return style;
  }, [width, height]);

  // ✅ Stable fallback (always works)
  const Fallback = (
    <Image
      src="/img/xpot-logo-light.png"
      alt="XPOT"
      width={132}
      height={36}
      priority
      className={['block h-full w-full object-contain', className].join(' ')}
    />
  );

  // Render PNG until client is mounted, then swap to Lottie (no flicker)
  if (!mounted || failed) {
    return (
      <div
        className={['relative', className].join(' ')}
        style={Object.keys(sizeStyle).length ? sizeStyle : { width: 132, height: 36 }}
      >
        {Fallback}
      </div>
    );
  }

  return (
    <div
      className={['relative select-none', className].join(' ')}
      style={Object.keys(sizeStyle).length ? sizeStyle : { width: 132, height: 36 }}
      aria-label="XPOT"
    >
      <Lottie
        animationData={animationData as any}
        loop={loop}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
        // If anything goes wrong at runtime, fall back safely
        onComplete={() => {
          // if loop=false anywhere, this prevents the “plays once then dies” look
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
