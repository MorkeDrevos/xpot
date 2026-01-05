// components/home/hero/CosmicHeroBackdrop.tsx
'use client';

export default function CosmicHeroBackdrop() {
  return (
    <>
      <style jsx global>{`
        @keyframes xpotHeroRotate {
          0% {
            transform: translateZ(0) rotate(0deg) scale(1);
          }
          100% {
            transform: translateZ(0) rotate(360deg) scale(1);
          }
        }

        @keyframes xpotHeroSheen {
          0% {
            transform: translateX(-26%) translateY(-12%) rotate(10deg);
            opacity: 0;
          }
          18% {
            opacity: 0.26;
          }
          60% {
            opacity: 0.14;
          }
          100% {
            transform: translateX(26%) translateY(12%) rotate(10deg);
            opacity: 0;
          }
        }

        @keyframes xpotConsoleSweep {
          0% {
            transform: translateX(-55%) skewX(-12deg);
            opacity: 0;
          }
          15% {
            opacity: 0.22;
          }
          55% {
            opacity: 0.1;
          }
          100% {
            transform: translateX(55%) skewX(-12deg);
            opacity: 0;
          }
        }

        /* =========================
           Console sweep (kept)
        ========================== */
        .xpot-console-sweep {
          position: absolute;
          inset: -40px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 30%,
            rgba(var(--xpot-gold), 0.12) 48%,
            rgba(56, 189, 248, 0.05) 66%,
            transparent 100%
          );
          mix-blend-mode: screen;
          opacity: 0;
          filter: blur(0.2px);
          animation: xpotConsoleSweep 12s ease-in-out infinite;
          z-index: 2;
        }

        /* =========================
           Royal engine core
        ========================== */
        .xpot-hero-engine {
          position: absolute;
          inset: -200px;
          pointer-events: none;
          opacity: 0.9;
          filter: blur(0px);
          z-index: 0;
        }

        /* Rotating “gilded” aura (less green, more gold/champagne) */
        .xpot-hero-engine::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background:
            radial-gradient(circle at 28% 22%, rgba(var(--xpot-gold), 0.22), transparent 56%),
            radial-gradient(circle at 74% 26%, rgba(255, 255, 255, 0.08), transparent 58%),
            radial-gradient(circle at 62% 72%, rgba(56, 189, 248, 0.10), transparent 62%),
            radial-gradient(circle at 32% 80%, rgba(139, 92, 246, 0.10), transparent 62%),
            radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.0), rgba(0, 0, 0, 0.32) 72%, rgba(0, 0, 0, 0.55) 100%);
          animation: xpotHeroRotate 52s linear infinite;
          transform-origin: center;
          opacity: 0.95;
        }

        /* Inner “polish” + subtle vignette edge line */
        .xpot-hero-engine::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background:
            radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.06), transparent 56%),
            radial-gradient(circle at 50% 50%, rgba(var(--xpot-gold), 0.08), transparent 64%),
            radial-gradient(circle at 50% 50%, transparent 62%, rgba(255, 255, 255, 0.04) 78%, transparent 86%);
          opacity: 0.62;
          mix-blend-mode: screen;
        }

        /* =========================
           Grain (kept but tuned)
        ========================== */
        .xpot-hero-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.18;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)' opacity='.32'/%3E%3C/svg%3E");
          background-size: 260px 260px;
          mix-blend-mode: overlay;
          z-index: 1;
        }

        /* =========================
           Royal sheen pass
        ========================== */
        .xpot-hero-sheen {
          position: absolute;
          inset: -70px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 30%,
            rgba(var(--xpot-gold), 0.10) 50%,
            rgba(56, 189, 248, 0.05) 70%,
            transparent 100%
          );
          transform: rotate(10deg);
          animation: xpotHeroSheen 10.6s ease-in-out infinite;
          mix-blend-mode: screen;
          opacity: 0;
          z-index: 3;
        }

        /* Optional: tiny edge darkening for “onyx frame” feel */
        .xpot-hero-onyx-vignette {
          position: absolute;
          inset: -20px;
          pointer-events: none;
          border-radius: 999px;
          background: radial-gradient(circle at 50% 50%, transparent 58%, rgba(0, 0, 0, 0.55) 100%);
          opacity: 0.55;
          z-index: 2;
        }
      `}</style>

      <div className="xpot-hero-engine" aria-hidden />
      <div className="xpot-hero-onyx-vignette" aria-hidden />
      <div className="xpot-hero-sheen" aria-hidden />
      <div className="xpot-hero-grain" aria-hidden />
    </>
  );
}
