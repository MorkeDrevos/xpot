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

      // offsetHeight is integer px (includes borders) - no subpixel weirdness
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
        {/* Lock banner height so it never “breathes” */}
        <div className="flex h-12 items-center justify-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-white/80">
            PRE-LAUNCH MODE <span className="mx-2 text-white/40">•</span> XPOT TOKEN NOT DEPLOYED{' '}
            <span className="mx-2 text-white/40">•</span> BUILD v0.9.7
          </p>
        </div>
      </div>
    </div>
  );
}
