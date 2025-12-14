'use client';

import { useEffect, useRef } from 'react';

type PreLaunchBannerProps = {
  // Optional: allow you to force-hide banner if needed later
  hidden?: boolean;
};

export default function PreLaunchBanner({ hidden = false }: PreLaunchBannerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (hidden) {
      document.documentElement.style.setProperty('--xpot-banner-h', '0px');
      return;
    }

    function setVar() {
      const el = ref.current;
      if (!el) return;

      // Use real rendered height (incl. borders)
      const h = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--xpot-banner-h', `${h}px`);
    }

    setVar();

    // Track resize + font load + layout changes
    const ro = new ResizeObserver(() => setVar());
    if (ref.current) ro.observe(ref.current);

    window.addEventListener('resize', setVar);

    // Safety: if fonts/layout settle after first paint
    const t = window.setTimeout(setVar, 50);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', setVar);
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
        <div className="flex items-center justify-center py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/80">
            PRE-LAUNCH MODE <span className="mx-2 text-white/40">•</span> XPOT TOKEN NOT DEPLOYED{' '}
            <span className="mx-2 text-white/40">•</span> BUILD v0.9.7
          </p>
        </div>
      </div>
    </div>
  );
}
