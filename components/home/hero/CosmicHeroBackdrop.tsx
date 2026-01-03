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
            transform: translateX(-25%) translateY(-10%) rotate(8deg);
            opacity: 0;
          }
          20% {
            opacity: 0.28;
          }
          60% {
            opacity: 0.18;
          }
          100% {
            transform: translateX(25%) translateY(10%) rotate(8deg);
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
        .xpot-console-sweep {
          position: absolute;
          inset: -40px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 30%,
            rgba(var(--xpot-gold), 0.1) 48%,
            rgba(56, 189, 248, 0.06) 66%,
            transparent 100%
          );
          mix-blend-mode: screen;
          opacity: 0;
          filter: blur(0.2px);
          animation: xpotConsoleSweep 12s ease-in-out infinite;
          z-index: 2;
        }
        .xpot-hero-engine {
          position: absolute;
          inset: -180px;
          pointer-events: none;
          opacity: 0.85;
          filter: blur(0px);
        }
        .xpot-hero-engine::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 25%, rgba(16, 185, 129, 0.18), transparent 55%),
            radial-gradient(circle at 70% 25%, rgba(56, 189, 248, 0.14), transparent 58%),
            radial-gradient(circle at 55% 70%, rgba(var(--xpot-gold), 0.12), transparent 62%),
            radial-gradient(circle at 30% 80%, rgba(139, 92, 246, 0.12), transparent 60%);
          animation: xpotHeroRotate 44s linear infinite;
          transform-origin: center;
          opacity: 0.95;
        }
        .xpot-hero-engine::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05), transparent 55%);
          opacity: 0.55;
          mix-blend-mode: screen;
        }
        .xpot-hero-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.22;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
          background-size: 260px 260px;
          mix-blend-mode: overlay;
        }
        .xpot-hero-sheen {
          position: absolute;
          inset: -60px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 32%,
            rgba(var(--xpot-gold), 0.08) 50%,
            rgba(56, 189, 248, 0.06) 68%,
            transparent 100%
          );
          transform: rotate(8deg);
          animation: xpotHeroSheen 9.8s ease-in-out infinite;
          mix-blend-mode: screen;
          opacity: 0;
        }
      `}</style>

      <div className="xpot-hero-engine" aria-hidden />
      <div className="xpot-hero-sheen" aria-hidden />
      <div className="xpot-hero-grain" aria-hidden />
    </>
  );
}
