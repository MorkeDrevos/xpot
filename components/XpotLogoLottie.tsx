'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// ✅ Use the file that actually exists in your repo
// /app/animations/xpot_logo_loop.json
import animationData from '../app/animations/xpot_logo_loop.json';

export type XpotLogoLottieProps = {
  className?: string;

  // how often to do the “premium double flash”
  burstEveryMs?: number; // default 20000

  // base opacity when not flashing
  idleOpacity?: number; // default 0.92

  // durations for the double flash feel
  flashDurationMs?: number; // default 900 (whole double flash)
};

export default function XpotLogoLottie({
  className,
  burstEveryMs = 20000,
  idleOpacity = 0.92,
  flashDurationMs = 900,
}: XpotLogoLottieProps) {
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setFlashKey((k) => k + 1);
    }, burstEveryMs);

    return () => window.clearInterval(t);
  }, [burstEveryMs]);

  const style = useMemo(
    () => ({
      height: '100%',
      width: 'auto',
    }),
    []
  );

  return (
    <div
      className={['inline-flex items-center select-none', className].filter(Boolean).join(' ')}
      style={{ opacity: idleOpacity }}
    >
      {/* key changes force the animation class to restart cleanly */}
      <div
        key={flashKey}
        className="xpotLogoWrap"
        style={{ animationDuration: `${flashDurationMs}ms` }}
      >
        <Lottie
          animationData={animationData as any}
          autoplay={true}
          loop={true}
          style={style}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true,
          }}
        />
      </div>

      <style jsx>{`
        /* Double flash (slow premium): two peaks, then back to idle */
        .xpotLogoWrap {
          animation-name: xpotDoubleFlash;
          animation-timing-function: ease-in-out;
        }

        @keyframes xpotDoubleFlash {
          0% { opacity: 1; filter: drop-shadow(0 0 0 rgba(16,185,129,0)); }
          18% { opacity: 1; filter: drop-shadow(0 0 10px rgba(16,185,129,0.35)); }
          33% { opacity: 0.55; filter: drop-shadow(0 0 0 rgba(16,185,129,0)); }

          55% { opacity: 1; filter: drop-shadow(0 0 14px rgba(16,185,129,0.40)); }
          72% { opacity: 0.65; filter: drop-shadow(0 0 0 rgba(16,185,129,0)); }

          100% { opacity: 1; filter: drop-shadow(0 0 0 rgba(16,185,129,0)); }
        }
      `}</style>
    </div>
  );
}
