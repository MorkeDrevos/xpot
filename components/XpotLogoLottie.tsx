'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type XpotLogoLottieProps = {
  className?: string;
  width?: number;
  height?: number;
};

export default function XpotLogoLottie({
  className = '',
  width = 460,
  height = 120,
}: XpotLogoLottieProps) {
  const [burst, setBurst] = useState(0);
  const lastBurstAtRef = useRef<number>(0);

  const triggerBurst = useCallback((reason: 'auto' | 'hover') => {
    const now = Date.now();

    // Prevent “spam flashing” from hover jitter
    // Hover can only trigger once every 4 seconds.
    if (reason === 'hover' && now - lastBurstAtRef.current < 4000) return;

    lastBurstAtRef.current = now;
    setBurst((b) => b + 1);
  }, []);

  // Auto burst every 20s
  useEffect(() => {
    const i = setInterval(() => triggerBurst('auto'), 20000);
    return () => clearInterval(i);
  }, [triggerBurst]);

  return (
    <div
      className={['relative overflow-hidden select-none', className].join(' ')}
      style={{ width, height, minWidth: width, minHeight: height }}
      onMouseEnter={() => triggerBurst('hover')}
      aria-label="XPOT"
      role="img"
    >
      {/* Base logo - slightly dimmed so highlight reads */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          filter: 'brightness(0.84) drop-shadow(0 12px 28px rgba(0,0,0,0.8))',
        }}
      />

      {/* Specular sweep (mask fixed, background moves) */}
      <div
        key={burst}
        className="absolute inset-0 pointer-events-none xpot-sweep"
        style={{
          // Thinner, more premium band (less “flash”, more “metal”)
          background:
            'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0) 44%, rgba(255,255,255,0.72) 50%, rgba(255,255,255,0) 56%, transparent 100%)',
          backgroundSize: '260% 100%',
          backgroundPosition: '-160% 0%',
          mixBlendMode: 'screen',

          WebkitMaskImage: 'url(/img/xpot-logo-light.png)',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskImage: 'url(/img/xpot-logo-light.png)',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          maskSize: 'contain',
        }}
      />

      <style jsx>{`
        .xpot-sweep {
          animation: xpotSweep 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        @keyframes xpotSweep {
          0% {
            opacity: 0;
            background-position: -160% 0%;
          }
          18% {
            opacity: 1;
          }
          82% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            background-position: 160% 0%;
          }
        }
      `}</style>
    </div>
  );
}
