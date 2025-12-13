'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import animationData from '@/app/animations/xpot-logo.json';

type Props = {
  className?: string;

  // Timing
  burstEveryMs?: number; // default 20000
  pauseBetweenFlashesMs?: number; // default 700 (premium)
  speed?: number; // default 0.65 (slow)
  idleOpacity?: number; // default 0.95
  burstFrames?: number; // optional slice of the animation
};

export default function XpotLogoLottie({
  className = '',
  burstEveryMs = 20000,
  pauseBetweenFlashesMs = 700,
  speed = 0.65,
  idleOpacity = 0.95,
  burstFrames,
}: Props) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const [isHover, setIsHover] = useState(false);
  const [mounted, setMounted] = useState(false);
  const busyRef = useRef(false);

  const totalFrames = useMemo(() => {
    const anyData: any = animationData as any;
    const op = typeof anyData?.op === 'number' ? anyData.op : null;
    const ip = typeof anyData?.ip === 'number' ? anyData.ip : 0;
    if (op !== null) return Math.max(0, Math.floor(op - ip));
    return null;
  }, []);

  const playOnce = () => {
    const inst = lottieRef.current;
    if (!inst) return;

    // slow + premium
    try {
      inst.setSpeed(speed);
    } catch {}

    inst.goToAndStop(0, true);

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

  const playDoubleFlash = async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    playOnce();
    await new Promise((r) => setTimeout(r, pauseBetweenFlashesMs));
    playOnce();

    // small lock so it doesn’t stutter if you hover repeatedly
    await new Promise((r) => setTimeout(r, 350));
    busyRef.current = false;
  };

  useEffect(() => setMounted(true), []);

  // every 20s (but not while hovered)
  useEffect(() => {
    if (!mounted) return;

    const t = window.setInterval(() => {
      if (!isHover) playDoubleFlash();
    }, burstEveryMs);

    return () => window.clearInterval(t);
  }, [mounted, burstEveryMs, isHover]);

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
        playDoubleFlash();
      }}
      onMouseLeave={() => setIsHover(false)}
      aria-label="XPOT"
      title="XPOT"
    >
      <div className="relative">
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
    </div>
  );
}
