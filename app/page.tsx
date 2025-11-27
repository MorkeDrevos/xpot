"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';

function formatTime(ms: number) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function Home() {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // simple 24h countdown from page load (placeholder)
  useEffect(() => {
    const end = Date.now() + 24 * 60 * 60 * 1000;
    const t = setInterval(() => {
      setTimeLeft(end - Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-950/60 shadow-[0_0_80px_rgba(15,23,42,0.9)] backdrop-blur-xl px-6 py-8 md:px-10 md:py-10 space-y-8">
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
    className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-slate-50 transition"
  >
    Dashboard
  </Link>
</div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            <span className="text-slate-300">💎 XPOT</span>{" "}
            <span className="text-slate-50">– The X-powered crypto jackpot.</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl">
            Hold <span className="font-semibold text-emerald-300">$XPOT</span>, post
            your entry tweet, and watch the daily draw. One winner. One jackpot.
          </p>
        </header>

        {/* Main area */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Jackpot card */}
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-6 flex flex-col gap-6 justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Today&apos;s main jackpot
                </span>
                <span className="text-[10px] rounded-full border border-amber-400/40 bg-amber-400/5 px-2 py-0.5 text-amber-200 uppercase tracking-[0.18em]">
                  One winner only
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-semibold text-emerald-300">
                  $10,000
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                  est. prize pool
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">
                Next draw starts in
              </p>
              <p className="font-mono text-2xl md:text-3xl text-slate-50">
                {formatTime(timeLeft)}
              </p>
              <p className="text-xs text-slate-400">
                Live, provably fair draws. The winner wallet is picked on-chain and
                paid directly.
              </p>
            </div>
          </div>

          {/* Entry steps */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
  <h2 className="text-xl font-semibold text-slate-200">
    How to enter the XPOT jackpot
  </h2>

  <ol className="mt-4 space-y-4 text-sm text-slate-300">
    <li>
      <span className="font-semibold text-slate-200">Buy & hold XPOT</span>
      <br />
      Pick up XPOT on Solana and hold the minimum for the round.
    </li>

    <li>
      <span className="font-semibold text-slate-200">Post your entry tweet</span>
      <br />
      Send one pre-filled tweet from XPOT. This activates your account forever.
    </li>

    <li>
      <span className="font-semibold text-slate-200">Balance = more entries</span>
      <br />
      After activation, entries are based purely on how much XPOT you hold.
    </li>
  </ol>

  <p className="mt-4 text-xs text-slate-400">
    You only tweet once. Your balance controls entries forever.
  </p>
</div>
        </section>
      </div>
    </main>
  );
}
