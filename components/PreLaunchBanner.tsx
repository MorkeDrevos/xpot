// components/PreLaunchBanner.tsx
'use client';

import { useEffect, useRef } from 'react';

type PreLaunchBannerProps = {
  hidden?: boolean;
};

export default function PreLaunchBanner({ hidden = false }: PreLaunchBannerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    if (hidden) {
      root.style.setProperty('--xpot-banner-h', '0px');
      return;
    }

    function setVar() {
      const el = ref.current;
      if (!el) return;
      const h = el.offsetHeight || 0;
      root.style.setProperty('--xpot-banner-h', `${h}px`);
    }

    setVar();

    const ro = new ResizeObserver(() => setVar());
    if (ref.current) ro.observe(ref.current);

    window.addEventListener('resize', setVar);
    const t1 = window.setTimeout(setVar, 0);
    const t2 = window.setTimeout(setVar, 120);

    return () => {
      window.removeEventListener('resize', setVar);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      ref={ref}
      className="
        fixed inset-x-0 top-0 z-[60]
        border-b border-white/10
        bg-gradient-to-r from-[#5b21b6] via-[#2e1065] to-[#111827]
      "
    >
      <div className="mx-auto max-w-[1440px] px-4">
        <div className="flex h-12 items-center justify-center">
          {/* NOTE: animation stopped because there is no animation class/keyframes on this element.
              If you previously had moving shimmer/scroll, it was likely removed from globals.css
              (keyframes) or removed from the className here.
              Below I re-add a subtle animated shimmer background that does NOT change layout height. */}
          <div className="relative w-full">
            <div
  className="
    pointer-events-none absolute inset-0
    opacity-60
    bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]
    translate-x-[-60%]
    animate-[xpotBannerSweep_5.5s_linear_infinite]
  "
/>
            <p className="relative text-center text-[12px] font-semibold uppercase tracking-[0.32em] text-white/80">
              PRE-LAUNCH MODE <span className="mx-2 text-white/40">•</span> CONTRACT DEPLOYED{' '}
              <span className="mx-2 text-white/40">•</span> OFFICIAL CA VERIFIED{' '}
              <span className="mx-2 text-white/40">•</span> TRADING NOT ACTIVE YET{' '}
            </p>
          </div>
        </div>
      </div>

      {/* Keyframes kept local so it can’t “disappear” if globals.css changed */}
      <style jsx global>{`
        @keyframes xpotBannerSweep {
          0% {
            transform: translateX(-60%);
          }
          100% {
            transform: translateX(160%);
          }
        }
      `}</style>
    </div>
  );
}
