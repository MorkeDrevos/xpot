// components/PreLaunchBanner.tsx
'use client';

import { useLayoutEffect, useRef } from 'react';

type PreLaunchBannerProps = {
  hidden?: boolean;
};

export default function PreLaunchBanner({ hidden = false }: PreLaunchBannerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    if (hidden) {
      root.style.setProperty('--xpot-banner-h', '0px');
      return;
    }

    const setVar = () => {
      const el = ref.current;
      if (!el) return;
      const h = el.offsetHeight || 0;
      root.style.setProperty('--xpot-banner-h', `${h}px`);
    };

    setVar();

    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => setVar());
      if (ref.current) ro.observe(ref.current);
    }

    window.addEventListener('resize', setVar);

    const t1 = window.setTimeout(setVar, 0);
    const t2 = window.setTimeout(setVar, 120);

    return () => {
      window.removeEventListener('resize', setVar);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (ro) ro.disconnect();
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-[60] hidden sm:block"
      aria-label="XPOT live status banner"
    >
      <div
        className="
          relative
          border-b border-white/10
          bg-black/40
          backdrop-blur-xl
          shadow-[0_10px_26px_rgba(0,0,0,0.32)]
        "
      >
        {/* Premium animated layers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 xpot-banner-bed" />
          <div className="absolute inset-0 xpot-banner-conic" />
          <div className="absolute inset-0 xpot-banner-sheen" />
          <div className="absolute inset-0 xpot-banner-noise opacity-[0.14]" />
          <div className="absolute inset-0 xpot-banner-vignette" />
        </div>

        <div className="mx-auto max-w-[1440px] px-4">
          <div className="flex h-11 items-center justify-center">
            <div className="relative flex items-center justify-center gap-3">
              {/* calmer / smaller status pill */}
              <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/75">
                <span className="xpot-banner-dot" />
                STATUS
              </span>

              <p className="flex items-center justify-center gap-3 text-center text-[11px] font-semibold uppercase tracking-[0.30em] text-white/80">
                {/* LIVE pulse (subtle, premium) */}
                <span className="relative inline-flex items-center gap-2">
                  <span className="xpot-live-pulse" aria-hidden />
                  <span className="text-white/90">LIVE</span>
                </span>

                <span className="text-white/30">•</span>
                <span>CONTRACT DEPLOYED</span>
                <span className="text-white/30">•</span>
                <span>TRADING ACTIVE</span>

                {/* calm auto refresh indicator */}
                <span className="ml-2 hidden lg:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] tracking-[0.22em] text-white/70">
                  <span className="xpot-refresh-dot" aria-hidden />
                  LIVE REFRESH
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .xpot-banner-bed,
          .xpot-banner-conic,
          .xpot-banner-sheen,
          .xpot-banner-dot,
          .xpot-live-pulse,
          .xpot-refresh-dot {
            animation: none !important;
          }
        }

        .xpot-banner-bed {
          background:
            radial-gradient(1100px 56px at 12% 50%, rgba(56, 189, 248, 0.16), transparent 62%),
            radial-gradient(900px 56px at 56% 40%, rgba(99, 102, 241, 0.16), transparent 64%),
            radial-gradient(900px 56px at 90% 55%, rgba(236, 72, 153, 0.12), transparent 66%),
            linear-gradient(90deg, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.70), rgba(2, 6, 23, 0.92));
          filter: saturate(1.04);
        }

        .xpot-banner-conic {
          background: conic-gradient(
            from 180deg at 50% 50%,
            rgba(56, 189, 248, 0.14),
            rgba(99, 102, 241, 0.14),
            rgba(236, 72, 153, 0.10),
            rgba(56, 189, 248, 0.14)
          );
          opacity: 0.45;
          mix-blend-mode: screen;
          transform: translateZ(0);
          animation: xpotBannerConic 16s ease-in-out infinite;
          filter: blur(16px);
        }

        @keyframes xpotBannerConic {
          0% {
            transform: translate3d(0, 0, 0) scale(1.04) rotate(0deg);
            opacity: 0.38;
          }
          50% {
            transform: translate3d(0, 0, 0) scale(1.08) rotate(6deg);
            opacity: 0.52;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1.04) rotate(0deg);
            opacity: 0.38;
          }
        }

        .xpot-banner-sheen {
          background: linear-gradient(
            110deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 18%,
            rgba(255, 255, 255, 0.10) 24%,
            rgba(255, 255, 255, 0.05) 30%,
            transparent 55%
          );
          background-size: 220% 100%;
          background-position: 120% 0%;
          opacity: 0.65;
          will-change: background-position;
          animation: xpotBannerSheen 7.8s linear infinite;
        }

        @keyframes xpotBannerSheen {
          0% {
            background-position: 120% 0%;
            opacity: 0.5;
          }
          45% {
            opacity: 0.72;
          }
          100% {
            background-position: -120% 0%;
            opacity: 0.5;
          }
        }

        .xpot-banner-noise {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.45'/%3E%3C/svg%3E");
          background-size: 240px 240px;
          mix-blend-mode: overlay;
          filter: contrast(1.05);
        }

        .xpot-banner-vignette {
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.46) 0%,
            rgba(0, 0, 0, 0.12) 20%,
            rgba(0, 0, 0, 0.12) 80%,
            rgba(0, 0, 0, 0.46) 100%
          );
          opacity: 0.92;
        }

        .xpot-banner-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.85);
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.10), 0 0 14px rgba(34, 197, 94, 0.28);
          animation: xpotBannerDot 2.2s ease-in-out infinite;
        }

        @keyframes xpotBannerDot {
          0%,
          100% {
            transform: scale(0.94);
            opacity: 0.82;
          }
          50% {
            transform: scale(1.06);
            opacity: 1;
          }
        }

        /* ✅ subtle LIVE pulse (calmer than ping) */
        .xpot-live-pulse {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.90);
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.0);
          animation: xpotLivePulse 2.6s ease-in-out infinite;
        }

        @keyframes xpotLivePulse {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.0), 0 0 12px rgba(34, 197, 94, 0.18);
            opacity: 0.86;
            transform: scale(0.98);
          }
          55% {
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.09), 0 0 16px rgba(34, 197, 94, 0.22);
            opacity: 1;
            transform: scale(1.02);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.0), 0 0 12px rgba(34, 197, 94, 0.18);
            opacity: 0.86;
            transform: scale(0.98);
          }
        }

        /* calmer refresh dot */
        .xpot-refresh-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.85);
          box-shadow: 0 0 14px rgba(148, 163, 184, 0.18);
          animation: xpotRefreshDot 3.4s ease-in-out infinite;
        }

        @keyframes xpotRefreshDot {
          0%,
          100% {
            opacity: 0.62;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.92;
            transform: scale(1.04);
          }
        }
      `}</style>
    </div>
  );
}
