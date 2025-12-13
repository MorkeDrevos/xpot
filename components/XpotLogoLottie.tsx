'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

// Put your JSON here (adjust path if needed)
import animationData from '@/app/animations/xpot-logo.json';

type Props = {
  className?: string;

  // Optional fine tuning
  burstEveryMs?: number; // default 20000
  burstFrames?: number; // how many frames to play on a burst (default: full anim)
  idleOpacity?: number; // default 0.92
};

export default function XpotLogoLottie({
  className = '',
  burstEveryMs = 20000,
  burstFrames,
  idleOpacity = 0.92,
}: Props) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const [isHover, setIsHover] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Determine total frames (best-effort)
  const totalFrames = useMemo(() => {
    const anyData: any = animationData as any;
    // lottie JSON usually has "op" (out point) and "ip" (in point)
    const op = typeof anyData?.op === 'number' ? anyData.op : null;
    const ip = typeof anyData?.ip === 'number' ? anyData.ip : 0;
    if (op !== null) return Math.max(0, Math.floor(op - ip));
    return null;
  }, []);

  const playBurst = (reason: 'hover' | 'timer') => {
    const inst = lottieRef.current;
    if (!inst) return;

    // Ensure we always restart from the beginning for a crisp premium burst
    inst.goToAndStop(0, true);

    // Play either a slice or full
    const framesToPlay =
      typeof burstFrames === 'number' && burstFrames > 0
        ? burstFrames
        : totalFrames ?? undefined;

    if (typeof framesToPlay === 'number') {
      inst.playSegments([0, framesToPlay], true);
    } else {
      inst.play();
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Timer burst every 20s (or whatever you set) - ONLY after mounted
  useEffect(() => {
    if (!mounted) return;

    const t = window.setInterval(() => {
      // Don’t spam while hovered - hover already triggers bursts naturally
      if (!isHover) playBurst('timer');
    }, burstEveryMs);

    return () => window.clearInterval(t);
  }, [mounted, burstEveryMs, isHover]);

  // Slight “premium glow” effect without being loud
  // (We keep the Lottie itself subtle, and use CSS for glow)
  return (
    <div
      className={[
        'inline-flex items-center select-none',
        'transition-opacity duration-500',
        className,
      ].join(' ')}
      style={{ opacity: idleOpacity }}
      onMouseEnter={() => {
        setIsHover(true);
        playBurst('hover');
      }}
      onMouseLeave={() => setIsHover(false)}
      aria-label="XPOT"
      title="XPOT"
    >
      <div
        className={[
          'relative',
          // A tiny glow on hover only = premium
          'transition-all duration-500',
          isHover ? 'drop-shadow-[0_0_18px_rgba(120,255,220,0.25)]' : '',
        ].join(' ')}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          autoplay={false}
          loop={false}
          // Renderer quality
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true,
          }}
          style={{
            height: '100%',
            width: 'auto',
          }}
        />
      </div>
    </div>
  );
}
