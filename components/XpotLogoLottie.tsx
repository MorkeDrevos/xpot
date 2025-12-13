// components/XpotLogoLottie.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
      style={{ width, height }}
      onMouseEnter={triggerBurst}
      aria-label="XPOT"
      role="img"
    >
      {/* BASE LOGO – intentionally slightly dimmed */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          filter:
            'brightness(0.82) drop-shadow(0 12px 28px rgba(0,0,0,0.8))',
        }}
      />

      {/* SPECULAR SWEEP – THIS IS WHAT YOU SEE */}
      <div
        key={burst}
        className="absolute inset-0 pointer-events-none"
        style={{
          animation: 'xpot-sweep 1.4s ease-out',
          background:
            'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.0) 38%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.0) 62%, transparent 100%)',

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

      {/* Local animation (scoped) */}
      <style jsx>{`
        @keyframes xpot-sweep {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateX(120%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
