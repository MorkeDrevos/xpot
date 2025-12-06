// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import XpotAccessGate from '../components/XpotAccessGate';
import XpotLogo from '../components/XpotLogo';

import DeployWatcher from '../components/DeployWatcher';
import ThemeToggle from '../components/ThemeToggle';

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

  useEffect(() => {
    const end = Date.now() + 24 * 60 * 60 * 1000;
    const timer = setInterval(() => {
      setTimeLeft(end - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-[color:var(--bg)] admin-shell-bg">
      {/* Outer glow shell */}
      <div className="w-full max-w-4xl rounded-[32px] bg-gradient-to-br from-purple-500/25 via-slate-950 to-cyan-400/20 p-[1px] shadow-[0_0_80px_rgba(15,23,42,0.9)]">
        <div className="space-y-8 rounded-[30px] border border-slate-800/80 bg-slate-950/70 px-6 py-8 backdrop-blur-xl md:px-10 md:py-10">
          {/* Top label */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            XPOT • The X-Powered Reward Protocol • Solana
          </div>

          {/* Hero */}
          <header className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              {/* Logo + micro tagline */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-purple-500/40 via-transparent to-cyan-400/40 p-[1px]">
                  <div className="rounded-xl bg-[#050b1b]/80 px-3 py-2 backdrop-blur-xl">
                    <XpotLogo variant="light" height={40} />
                  </div>
                </div>
                <p className="hidden text-[11px] text-slate-400 sm:inline">
                  Daily access, verified identity, on-chain XPOT rewards.
                </p>
              </div>

              {/* Dashboard link */}
              <div className="flex justify-end">
                <Link
                  href="/dashboard"
                  className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-50"
                >
                  Dashboard
                </Link>
              </div>
            </div>

            {/* SEO h1 (kept for semantics) */}
            <h1 className="sr-only">
              XPOT · The X-Powered Reward Protocol
            </h1>

            <p className="max-w-2xl text-sm text-slate-300 md:text-base">
              One protocol. One identity. One daily{' '}
              <span className="font-semibold text-emerald-300">$XPOT</span> draw.
              One main XPOT daily. Occasional bonus drops.
            </p>
          </header>

          {/* Main area */}
          <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* Jackpot card */}
            <div className="flex flex-col justify-between gap-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-[#050b1b] to-slate-950/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.9)]">
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

            {/* Right: X login */}
            <XpotAccessGate className="h-full" />
          </section>
        </div>
      </div>
    </main>
  );
}
