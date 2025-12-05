// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import XpotAccessGate from '@/components/XpotAccessGate';

function formatTime(ms: number) {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function Home() {
  const [timeLeft, setTimeLeft] = useState(0);

  // simple 24h countdown from first render (placeholder)
  useEffect(() => {
    const end = Date.now() + 24 * 60 * 60 * 1000;
    const timer = setInterval(() => {
      setTimeLeft(end - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-4xl space-y-8 rounded-3xl border border-slate-800 bg-slate-950/60 px-6 py-8 shadow-[0_0_80px_rgba(15,23,42,0.9)] backdrop-blur-xl md:px-10 md:py-10">
        {/* Top label */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Daily on-chain jackpot • Solana
        </div>

        {/* Hero copy */}
        <header className="space-y-3">
          <div className="flex justify-end">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-50"
            >
              Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            <span className="text-slate-300">💎 XPOT</span>{' '}
            <span className="text-slate-50">
              - The X-powered crypto jackpot.
            </span>
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 md:text-base">
            Hold <span className="font-semibold text-emerald-300">$XPOT</span>, sign in
            with X, and watch the daily draw. One winner. One jackpot.
          </p>
        </header>

        {/* Main area */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Jackpot card */}
          <div className="flex flex-col justify-between gap-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Today&apos;s main XPOT
                </span>
                <span className="text-[10px] rounded-full border border-amber-400/40 bg-amber-400/5 px-2 py-0.5 uppercase tracking-[0.18em] text-amber-200">
                  One winner only
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-emerald-300 md:text-4xl">
                  $10,000
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  est. prize pool
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Next draw starts in
              </p>
              <p className="font-mono text-2xl text-slate-50 md:text-3xl">
                {formatTime(timeLeft)}
              </p>
              <p className="text-xs text-slate-400">
                Live, provably fair draws. The winner X account is picked from
                verified XPOT holders and paid directly on Solana.
              </p>
            </div>
          </div>

          {/* Right column – X login gate */}
          <XpotAccessGate className="h-full" />
        </section>
      </div>
    </main>
  );
}
