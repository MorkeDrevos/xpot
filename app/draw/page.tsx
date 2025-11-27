'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const mockCodes = [
  'XPOT-2F9K-7Q3B',
  'XPOT-9M1C-4Z8L',
  'XPOT-7V4P-1D2A',
  'XPOT-5K9Q-8R1T',
  'XPOT-3H7L-6W9E',
];

export default function DrawPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    // Simple easing: fast at start, slow at the end
    let totalDuration = 5500; // ms
    let steps = 40;
    let step = 0;

    function spin() {
      step += 1;
      setCurrentIndex((prev) => (prev + 1) % mockCodes.length);

      if (step < steps) {
        const t = step / steps;
        const delay = 40 + t * t * 140; // slow down
        setTimeout(spin, delay);
      } else {
        setIsSpinning(false);
      }
    }

    spin();
  }, []);

  const winnerCode = mockCodes[2]; // pretend winner

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_0_120px_rgba(16,185,129,0.25)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">
              Live XPOT draw
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Picking today’s jackpot wallet…
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:bg-slate-900"
          >
            Back to dashboard
          </Link>
        </div>

        {/* Roller */}
        <div className="mt-8 relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-6">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),transparent_60%)]" />
          <p className="text-xs text-slate-400">Entry code currently in focus</p>

          <div className="mt-4 flex items-center justify-center">
            <div className="rounded-full bg-black/40 px-6 py-3 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
              <span className="font-mono text-lg tracking-[0.3em] text-emerald-200">
                {mockCodes[currentIndex]}
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            {isSpinning
              ? 'Rolling through all eligible entry codes…'
              : `Winner locked: ${winnerCode}. Check your dashboard to see if it’s yours.`}
          </p>
        </div>
      </div>
    </main>
  );
}
