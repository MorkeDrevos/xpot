// components/XpotLogoLottie.tsx
'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Lottie from 'lottie-react';

// 🔒 Bundled animation (NO fetch, NO URL)
import animationData from '@/app/animations/xpot_logo_loop.json';

type XpotLogoLottieProps = {
  className?: string; // cosmetics only (cursor, select-none, etc.)
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
  const [lottieReady, setLottieReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const boxStyle = useMemo(
    () => ({
      width,
      height,
      minWidth: width,
      minHeight: height,
      maxWidth: width,
      maxHeight: height,
    }),
    [width, height],
  );

  return (
    <div
      className={['relative select-none', className].join(' ')}
      style={boxStyle}
      aria-label="XPOT"
    >
      {/* ✅ Always-on premium fallback (never blank) */}
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className="absolute inset-0 h-full w-full object-contain opacity-90"
        draggable={false}
      />

      {/* ✅ Lottie overlay (only fades in when ready) */}
      {!failed && (
        <div
          className="absolute inset-0"
          style={{
            opacity: lottieReady ? 1 : 0,
            transition: 'opacity 220ms ease',
          }}
        >
          <Lottie
            animationData={animationData as any}
            loop={loop}
            autoplay={autoplay}
            renderer="svg"
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid meet',
            }}
            style={{ width: '100%', height: '100%' }}
            // lottie-react event hooks
            onDOMLoaded={() => setLottieReady(true)}
            onDataFailed={() => setFailed(true)}
          />
        </div>
      )}
    </div>
  );
}
