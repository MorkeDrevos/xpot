// app/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import JackpotPanel from '@/components/JackpotPanel';

export default function HomePage() {
  const [jackpotUsd, setJackpotUsd] = useState<number | null>(null);

  // Placeholder until we wire real API:
  const todaysEntries = 'Live soon';
  const timeLeft = 'Closes once per day';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Cinematic background */}
      <div className="pointer-events-none fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_0%,rgba(45,212,191,0.12),transparent_55%),radial-gradient(circle_at_95%_10%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_50%_120%,rgba(129,140,248,0.25),transparent_60%)] opacity-80" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Top nav */}
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/img/xpot-logo-light.png"
                alt="XPOT"
                width={128}
                height={36}
                priority
              />
            </Link>
            <span className="hidden rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200 sm:inline-flex">
              Daily XPOT draw
            </span>
          </div>

          <nav className="flex items-center gap-4 text-xs sm:text-sm">
            <Link
              href="/dashboard"
              className="text-slate-300 hover:text-emerald-300 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="https://x.com"
              target="_blank"
              className="hidden text-slate-400 hover:text-slate-100 transition-colors sm:inline"
            >
              X / Twitter
            </Link>
            <Link
              href="/terms"
              className="hidden text-slate-500 hover:text-slate-200 transition-colors sm:inline"
            >
              Terms
            </Link>

            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_20px_60px_rgba(16,185,129,0.55)] transition-all hover:bg-emerald-400 hover:shadow-[0_26px_90px_rgba(16,185,129,0.9)]"
            >
              <span className="relative">
                Enter today&apos;s XPOT
                <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-[1px] origin-left scale-x-0 bg-slate-900/60 opacity-60 transition group-hover:scale-x-100" />
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-slate-900/80">
                Live
              </span>
            </Link>
          </nav>
        </header>

        {/* Hero layout */}
        <div className="grid flex-1 gap-10 lg:grid-cols-[1.35fr_minmax(0,1.1fr)] lg:items-stretch">
          {/* LEFT – Story + hype */}
          <section className="flex flex-col justify-center gap-7">
            <div className="space-y-5">
              <p className="inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-emerald-300 ring-1 ring-emerald-400/40">
                No tickets · Just XPOT holdings
              </p>

              <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.85rem] lg:leading-[1.05]">
                The daily on-chain{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                  XPOT pool
                </span>{' '}
                for X-powered holders.
              </h1>

              <p className="max-w-xl text-sm text-slate-300 sm:text-[15px]">
                XPOT is a fixed daily pool – for example{' '}
                <span className="font-semibold text-emerald-200">
                  1,000,000 XPOT
                </span>
                . You never buy tickets here. If you hold the minimum XPOT in
                your wallet, you can grab a free on-chain entry into today&apos;s
                draw and one XPOT holder is selected by their X handle.
              </p>
            </div>

            {/* Steps row */}
            <div className="mt-2 grid gap-4 text-sm sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/90 bg-slate-950/85 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.9)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Step 1
                </p>
                <p className="mt-1 font-semibold text-slate-100">
                  Hold the minimum XPOT
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Keep the threshold amount of XPOT in a self-custody wallet. No
                  lockups or staking UI, just your keys.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/90 bg-slate-950/85 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.85)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Step 2
                </p>
                <p className="mt-1 font-semibold text-slate-100">
                  Connect X &amp; claim
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Log in with your X account on the dashboard, verify holdings
                  and claim today&apos;s XPOT entry.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/90 bg-slate-950/85 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.85)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Step 3
                </p>
                <p className="mt-1 font-semibold text-slate-100">
                  One XPOT holder is picked
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Draw runs once per day. Winner is revealed by X handle and
                  paid directly in XPOT.
                </p>
              </div>
            </div>

            {/* CTA + reassurance */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100 transition-colors"
              >
                Go to XPOT dashboard
              </Link>
              <span className="text-[11px] text-slate-500">
                Winners revealed by handle – wallets stay in the background.
              </span>
            </div>
          </section>

          {/* RIGHT – Live XPOT engine */}
          <section className="relative flex items-stretch">
            <div className="relative w-full">
              {/* Outer animated glow shell */}
              <div className="jackpot-shell pointer-events-none absolute -inset-6 -z-10 rounded-[34px] bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.32),transparent_55%),radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.28),transparent_55%),radial-gradient(circle_at_50%_120%,rgba(129,140,248,0.45),transparent_60%)] opacity-90 blur-2xl" />

              <div className="jackpot-shell-inner rounded-[26px] border border-slate-800/80 bg-slate-950/95 shadow-[0_40px_110px_rgba(15,23,42,0.95)]">
                <JackpotPanel onJackpotUsdChange={setJackpotUsd} />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
                <p>
                  Live XPOT engine – the same panel admins use to monitor
                  today&apos;s draw.
                </p>
                <p className="flex items-center gap-1 text-emerald-300/80">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Pool is updating in real time.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* TODAY STATS STRIP */}
        <section className="mt-10 rounded-2xl border border-slate-800/90 bg-slate-950/90 px-4 py-4 shadow-[0_24px_80px_rgba(15,23,42,0.95)] sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Today&apos;s XPOT status
              </p>
              <p className="text-xs text-slate-400">
                One shared pool. One entry per eligible XPOT holder. One daily
                winner.
              </p>
            </div>

            <div className="grid w-full gap-4 text-xs sm:w-auto sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Today&apos;s XPOT pool
                </p>
                <p className="mt-1 font-mono text-sm text-slate-100">
                  {jackpotUsd !== null ? (
                    <>
                      <span className="text-slate-400 mr-1 align-middle text-[11px]">
                        ≈
                      </span>
                      {jackpotUsd.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 2,
                      })}
                    </>
                  ) : (
                    'Syncing…'
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Entries in today&apos;s pool
                </p>
                <p className="mt-1 font-mono text-sm text-emerald-300">
                  {todaysEntries}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Draw timing
                </p>
                <p className="mt-1 font-mono text-sm text-slate-100">
                  {timeLeft}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DIFFERENTIATORS */}
        <section className="mt-10 grid gap-6 text-xs text-slate-400 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/90 px-4 py-4">
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Transparent by design
            </p>
            <p>
              XPOT runs fully on-chain with verifiable entries, draws and
              payouts. Every winner can point to a transaction hash.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/90 px-4 py-4">
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              No ticket sales
            </p>
            <p>
              There are no ticket purchases on this site. Holding XPOT over the
              minimum is what qualifies you for the pool.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/90 px-4 py-4">
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Built for X-native holders
            </p>
            <p>
              Your X handle is your public identity, your wallet stays private.
              Rewards are paid directly to you in XPOT.
            </p>
          </div>
        </section>

        {/* RECENT ENTRANTS STRIP (stub – ready to wire later) */}
        <section className="mt-8 rounded-2xl border border-slate-900/90 bg-slate-950/95 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Live entrant feed
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              Soon you&apos;ll see X handles sliding in here as they grab
              today&apos;s entry.
            </p>
          </div>

          <div className="mt-2 flex gap-2 overflow-hidden text-[11px] text-slate-300 opacity-60">
            <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1">
              @x_handle_01 · entry locked
            </span>
            <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1">
              @x_handle_02 · entry locked
            </span>
            <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1">
              @x_handle_03 · entry locked
            </span>
            {/* Replace with real scrolling ticker once API exists */}
          </div>
        </section>
      </div>
    </main>
  );
}
