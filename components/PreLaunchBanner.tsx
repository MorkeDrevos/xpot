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
      className="
        fixed inset-x-0 top-0 z-[60]
        hidden sm:block
      "
      aria-label="XPOT pre-launch banner"
    >
      <div
        className="
          relative
          border-b border-white/10
          bg-black/50
          backdrop-blur-xl
          shadow-[0_10px_30px_rgba(0,0,0,0.35)]
        "
      >
        {/* Premium animated layers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Deep gradient bed */}
          <div className="absolute inset-0 xpot-banner-bed" />
          {/* Conic glow */}
          <div className="absolute inset-0 xpot-banner-conic" />
          {/* Sheen */}
          <div className="absolute inset-0 xpot-banner-sheen" />
          {/* Micro noise */}
          <div className="absolute inset-0 xpot-banner-noise opacity-[0.16]" />
          {/* Edge vignette */}
          <div className="absolute inset-0 xpot-banner-vignette" />
        </div>

        <div className="mx-auto max-w-[1440px] px-4">
          <div className="flex h-12 items-center justify-center">
            <div className="relative flex items-center justify-center gap-3">
              <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-white/80">
                <span className="xpot-banner-dot" />
                STATUS
              </span>

              <p className="text-center text-[12px] font-semibold uppercase tracking-[0.32em] text-white/80">
                PRE-LAUNCH MODE <span className="mx-2 text-white/35">•</span> CONTRACT DEPLOYED{' '}
                <span className="mx-2 text-white/35">•</span> TRADING NOT ACTIVE YET
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* ====== Motion safety ====== */
        @media (prefers-reduced-motion: reduce) {
          .xpot-banner-bed,
          .xpot-banner-conic,
          .xpot-banner-sheen,
          .xpot-banner-dot {
            animation: none !important;
          }
        }

        /* ====== Layers ====== */

        /* Bed: subtle premium wash (no harsh purple bar) */
        .xpot-banner-bed {
          background:
            radial-gradient(1200px 60px at 10% 50%, rgba(56, 189, 248, 0.22), transparent 60%),
            radial-gradient(900px 70px at 55% 35%, rgba(99, 102, 241, 0.22), transparent 62%),
            radial-gradient(900px 70px at 90% 60%, rgba(236, 72, 153, 0.18), transparent 65%),
            linear-gradient(90deg, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.92));
          filter: saturate(1.05);
        }

        /* Conic glow: very soft, slow drift */
        .xpot-banner-conic {
          background: conic-gradient(
            from 180deg at 50% 50%,
            rgba(56, 189, 248, 0.18),
            rgba(99, 102, 241, 0.18),
            rgba(236, 72, 153, 0.14),
            rgba(56, 189, 248, 0.18)
          );
          opacity: 0.55;
          mix-blend-mode: screen;
          transform: translateZ(0);
          animation: xpotBannerConic 14s ease-in-out infinite;
          filter: blur(14px);
        }

        @keyframes xpotBannerConic {
          0% {
            transform: translate3d(0, 0, 0) scale(1.06) rotate(0deg);
            opacity: 0.45;
          }
          50% {
            transform: translate3d(0, 0, 0) scale(1.1) rotate(8deg);
            opacity: 0.62;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1.06) rotate(0deg);
            opacity: 0.45;
          }
        }

        /* Sheen: smooth background-position shimmer (no translate jank) */
        .xpot-banner-sheen {
          background: linear-gradient(
            110deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 18%,
            rgba(255, 255, 255, 0.12) 24%,
            rgba(255, 255, 255, 0.06) 30%,
            transparent 55%
          );
          background-size: 220% 100%;
          background-position: 120% 0%;
          opacity: 0.75;
          will-change: background-position;
          animation: xpotBannerSheen 6.8s linear infinite;
        }

        @keyframes xpotBannerSheen {
          0% {
            background-position: 120% 0%;
            opacity: 0.55;
          }
          45% {
            opacity: 0.8;
          }
          100% {
            background-position: -120% 0%;
            opacity: 0.55;
          }
        }

        /* Noise: tiny SVG grain */
        .xpot-banner-noise {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.45'/%3E%3C/svg%3E");
          background-size: 220px 220px;
          mix-blend-mode: overlay;
          filter: contrast(1.05);
        }

        /* Vignette to keep edges clean */
        .xpot-banner-vignette {
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.45) 0%,
            rgba(0, 0, 0, 0.12) 18%,
            rgba(0, 0, 0, 0.12) 82%,
            rgba(0, 0, 0, 0.45) 100%
          );
          opacity: 0.9;
        }

        /* Small premium dot */
        .xpot-banner-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.9);
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12), 0 0 18px rgba(34, 197, 94, 0.35);
          animation: xpotBannerDot 1.8s ease-in-out infinite;
        }

        @keyframes xpotBannerDot {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.06);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
