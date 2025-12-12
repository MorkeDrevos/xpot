// components/XpotLogoLottie.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

// 🔒 Bundled animation JSON (MOST STABLE)
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
  width = 132,
  height = 36,
  loop = true,
  autoplay = true,
}: XpotLogoLottieProps) {
  const [Lottie, setLottie] = useState<any>(null);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Respect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener?.('change', handler);

    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Load lottie-react dynamically (avoids SSR / edge issues)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mod = await import('lottie-react');
        if (!cancelled) setLottie(() => mod.default);
      } catch (err) {
        console.error('[XPOT LOGO] Failed to load lottie-react:', err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 🔁 Hard fallback: static PNG
  if (failed || reducedMotion || !Lottie) {
    return (
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        className={className}
        priority
      />
    );
  }

  return (
    <div
      className={className}
      style={{ width, height }}
      aria-label="XPOT logo animation"
    >
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        renderer="svg"
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true,
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
