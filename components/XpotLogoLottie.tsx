'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

type XpotLogoLottieProps = {
  className?: string;
  width?: number;
  height?: number;
};

export default function XpotLogoLottie({
  className = '',
  width = 480,
  height = 130,
}: XpotLogoLottieProps) {
  const [burst, setBurst] = useState(0);

  const triggerBurst = useCallback(() => {
    setBurst((b) => b + 1);
  }, []);

  // Auto burst every 20s
  useEffect(() => {
    const i = setInterval(triggerBurst, 20000);
    return () => clearInterval(i);
  }, [triggerBurst]);

  return (
    <div
      className={['relative overflow-hidden select-none', className].join(' ')}
      style={{ width, height, minWidth: width, minHeight: height }}
      onMouseEnter={triggerBurst}
      aria-label="XPOT"
      role="img"
    >
      {/* Base logo - slightly dimmed so the highlight is visible */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          filter: 'brightness(0.82) drop-shadow(0 12px 28px rgba(0,0,0,0.8))',
        }}
      />

      {/* Specular sweep (mask stays fixed, only background moves) */}
      <div
        key={burst}
        className="absolute inset-0 pointer-events-none xpot-sweep"
        style={{
          // The sweep band
          background:
            'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 60%, transparent 100%)',
          backgroundSize: '240% 100%',
          backgroundPosition: '-140% 0%',
          mixBlendMode: 'screen',

          // Mask to logo pixels (fixed)
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
          animation: xpotSweep 1.35s ease-out forwards;
        }

        @keyframes xpotSweep {
          0% {
            opacity: 0;
            background-position: -140% 0%;
          }
          12% {
            opacity: 1;
          }
          88% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            background-position: 140% 0%;
          }
        }
      `}</style>
    </div>
  );
}
