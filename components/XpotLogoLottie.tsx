// components/XpotLogoLottie.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Lottie from 'lottie-react';

// ✅ Bundled (no fetch)
import animationData from '@/app/animations/xpot_logo_loop.json';

type XpotLogoLottieProps = {
  className?: string;

  // Fixed box (prevents layout shift)
  width?: number;
  height?: number;

  // Lottie controls
  loop?: boolean;
  autoplay?: boolean;

  // Fallback PNG (requested)
  fallbackSrc?: string;
};

export default function XpotLogoLottie({
  className = '',
  width = 180,
  height = 48,
  loop = true,
  autoplay = true,
  fallbackSrc = '/img/xpot-logo-light.png',
}: XpotLogoLottieProps) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    if (!mq) return;

    const apply = () => setReduceMotion(!!mq.matches);
    apply();

    // Safari compatibility
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', apply);
      else mq.removeListener(apply);
    };
  }, []);

  const sizeStyle = useMemo(
    () => ({
      width,
      height,
      minWidth: width,
      minHeight: height,
    }),
    [width, height],
  );

  return (
    <div
      className={['relative select-none', className].join(' ')}
      style={sizeStyle}
      aria-label="XPOT"
    >
      {/* ✅ Always-visible premium PNG base (never disappears) */}
      <Image
        src={fallbackSrc}
        alt="XPOT"
        width={width}
        height={height}
        priority
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />

      {/* ✅ Optional shimmer overlay (Lottie) */}
      {!reduceMotion && !failed && (
        <div
          className={[
            'pointer-events-none absolute inset-0',
            'transition-opacity duration-300',
            ready ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        >
          <Lottie
            animationData={animationData as any}
            loop={loop}
            autoplay={autoplay}
            rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
            style={{ width: '100%', height: '100%' }}
            onError={() => setFailed(true)}
            // First actual frame -> fade in the shimmer (prevents “flash then gone” feeling)
            onEnterFrame={() => {
              if (!ready) setReady(true);
            }}
          />
        </div>
      )}
    </div>
  );
}
