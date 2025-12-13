// components/XpotLogoLottie.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

// IMPORTANT: this path must match your repo
import animationData from '@/app/animations/xpot_logo_loop.json';

type Props = {
  size?: number;
  className?: string;

  // Animation behavior
  burstEveryMs?: number; // default 20000
  idleOpacity?: number; // default 0.95
};

export default function XpotLogoLottie({
  size = 44,
  className = '',
  burstEveryMs = 20000,
  idleOpacity = 0.95,
}: Props) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isHover, setIsHover] = useState(false);

  // “premium” timing
  const speed = 0.75; // slower = more premium
  const pauseBetweenFlashesMs = 900;

  useEffect(() => setMounted(true), []);

  const style = useMemo(
    () => ({ width: size, height: size }),
    [size]
  );

  function playOnce() {
    const inst = lottieRef.current;
    if (!inst) return;

    // ensure it starts from the beginning
    try {
      // lottie-web instance is available via getLottie()
      // lottie-react exposes setSpeed on ref in newer versions, but safest is lottie-web API:
      // @ts-ignore
      const lottie = inst.getLottie?.();
      if (lottie?.setSpeed) lottie.setSpeed(speed);
    } catch {}

    inst.goToAndPlay(0, true);
  }

  function playDoubleFlash() {
    const inst = lottieRef.current;
    if (!inst) return;

    // compute duration in ms (seconds * 1000) and adjust for speed
    let durMs = 900;
    try {
      // @ts-ignore
      const lottie = inst.getLottie?.();
      const seconds = typeof lottie?.getDuration === 'function' ? lottie.getDuration(false) : null;
      if (typeof seconds === 'number' && seconds > 0) {
        durMs = Math.round((seconds * 1000) / speed);
      }
    } catch {}

    playOnce();
    window.setTimeout(() => {
      playOnce();
      window.setTimeout(() => {
        // stop on final frame so it “rests”
        try {
          inst.pause();
        } catch {}
      }, durMs + 50);
    }, durMs + pauseBetweenFlashesMs);
  }

  // Timer burst (every 20s)
  useEffect(() => {
    if (!mounted) return;

    const id = window.setInterval(() => {
      // don’t spam while hovering (hover already triggers)
      if (!isHover) playDoubleFlash();
    }, burstEveryMs);

    return () => window.clearInterval(id);
  }, [mounted, burstEveryMs, isHover]);

  return (
    <div
      className={['inline-flex items-center select-none', className].join(' ')}
      style={{ opacity: idleOpacity }}
      onMouseEnter={() => {
        setIsHover(true);
        playDoubleFlash();
      }}
      onMouseLeave={() => setIsHover(false)}
      aria-label="XPOT"
      title="XPOT"
    >
      <div className="relative" style={style}>
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          autoplay={false}
          loop={false}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true,
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
