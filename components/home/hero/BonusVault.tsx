// components/home/hero/BonusVault.tsx
'use client';

import { ReactNode } from 'react';

export default function BonusVault({
  children,
  spotlight = true,
}: {
  children: ReactNode;
  spotlight?: boolean;
}) {
  const halo = spotlight ? 'opacity-95 blur-2xl' : 'opacity-75 blur-2xl';

  return (
    <div className="relative">
      <style jsx global>{`
        @keyframes xpotBonusSheen {
          0% {
            transform: translateX(-55%) skewX(-12deg);
            opacity: 0;
          }
          18% {
            opacity: 0.24;
          }
          60% {
            opacity: 0.12;
          }
          100% {
            transform: translateX(55%) skewX(-12deg);
            opacity: 0;
          }
        }
        .xpot-bonus-sheen {
          position: absolute;
          inset: -40px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 30%,
            rgba(139, 92, 246, 0.14) 48%,
            rgba(244, 63, 94, 0.08) 62%,
            rgba(56, 189, 248, 0.06) 74%,
            transparent 100%
          );
          mix-blend-mode: screen;
          opacity: 0;
          animation: xpotBonusSheen 10.5s ease-in-out infinite;
          z-index: 2;
        }
      `}</style>

      <div
        className={[
          'pointer-events-none absolute -inset-12',
          halo,
          "bg-[radial-gradient(circle_at_22%_38%,rgba(139,92,246,0.30),transparent_64%),radial-gradient(circle_at_78%_26%,rgba(244,63,94,0.12),transparent_60%),radial-gradient(circle_at_72%_30%,rgba(56,189,248,0.12),transparent_64%),radial-gradient(circle_at_85%_80%,rgba(var(--xpot-gold),0.12),transparent_66%)]",
        ].join(' ')}
      />

      <div className="relative overflow-hidden rounded-[28px] bg-white/[0.03] ring-1 ring-white/[0.06] shadow-[0_30px_110px_rgba(0,0,0,0.45)]">
        <div className="xpot-bonus-sheen" />
        <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-violet-400/25" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(139,92,246,0.55),rgba(var(--xpot-gold),0.30),rgba(56,189,248,0.25),transparent)]" />
        <div className="relative p-3 sm:p-4">{children}</div>
      </div>
    </div>
  );
}
