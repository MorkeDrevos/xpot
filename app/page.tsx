// app/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import JackpotPanel from '@/components/JackpotPanel';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Page shell */}
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Background glows */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_90%_20%,rgba(94,234,212,0.12),transparent_52%),radial-gradient(circle_at_50%_110%,rgba(168,85,247,0.18),transparent_55%)] opacity-70" />
        </div>

        {/* Top bar */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/img/xpot-logo-light.png"
                alt="XPOT"
                width={120}
                height={32}
                priority
              />
            </Link>
            <span className="hidden rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200 sm:inline-flex">
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
              className="text-slate-400 hover:text-slate-100 transition-colors"
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
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_20px_60px_rgba(16,185,129,0.5)] hover:bg-emerald-400 hover:shadow-[0_24px_80px_rgba(16,185,129,0.7)] transition-all"
            >
              Enter today&apos;s XPOT
            </Link>
          </nav>
        </header>

        {/* Main layout */}
        <div className="grid flex-1 gap-8 lg:grid-cols-[1.25fr_minmax(0,1.1fr)] lg:items-stretch">
          {/* Left: story + CTAs */}
          <section className="flex flex-col justify-center gap-6">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-300 ring-1 ring-emerald-500/30">
                No tickets – just XPOT holdings
              </p>

              <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                The daily on-chain{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                  XPOT pool
                </span>{' '}
                for X-powered holders.
              </h1>

              <p className="max-w-xl text-sm text-slate-300 sm:text-base">
                XPOT is a fixed daily pool – for example{' '}
                <span className="font-semibold text-emerald-200">
                  1,000,000 XPOT
                </span>
                . You don&apos;t buy tickets. If you hold the minimum XPOT in
                your wallet, you can grab a free entry into today&apos;s draw
                and one XPOT holder is selected.
              </p>
            </div>

            <div className="mt-2 grid gap-4 text-sm sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Step 1
                </p>
                <p className="mt-1 font-semibold text-slate-100">
                  Hold the minimum XPOT
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Keep the threshold amount of XPOT in a self-custody wallet.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Step 2
                </p>
                <p className="mt-1 font-semibold text-slate-100">
                  Connect X and claim
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Log in with your X account on the dashboard and grab
                  today&apos;s XPOT entry.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Step 3
                </p>
                <p className="mt-1 font-semibold text-slate-100">
                  One XPOT holder is picked
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Draw runs once per day. Winner is shown by X handle and paid
                  directly in XPOT.
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 transition-colors"
              >
                Go to XPOT dashboard
              </Link>
              <span className="text-[11px] text-slate-500">
                Winners revealed by handle – never by wallet.
              </span>
            </div>
          </section>

          {/* Right: live jackpot hero card */}
          <section className="relative flex items-stretch">
            <div className="relative w-full">
              {/* Outer glow shell */}
              <div className="jackpot-shell pointer-events-none absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.35),transparent_55%),radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.22),transparent_55%),radial-gradient(circle_at_50%_120%,rgba(129,140,248,0.4),transparent_60%)] opacity-80 blur-2xl" />

              <div className="jackpot-shell-inner rounded-[26px] border border-slate-800/80 bg-slate-950/90 shadow-[0_30px_90px_rgba(15,23,42,0.9)]">
                <JackpotPanel />
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                Live XPOT engine – the same panel admins use to monitor
                today&apos;s draw.
              </p>
            </div>
          </section>
        </div>

        {/* Bottom strip */}
        <section className="mt-10 grid gap-4 border-t border-slate-800 pt-6 text-xs text-slate-400 sm:grid-cols-3">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Transparent by design
            </p>
            <p>
              XPOT runs fully on-chain with verifiable entries, draws and
              payouts. Winners can always verify their TX.
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
              No ticket sales
            </p>
            <p>
              There are no ticket purchases on the site. Holding XPOT is what
              qualifies you for the daily pool.
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Built for X-native holders
            </p>
            <p>
              Your X handle is your public identity. The wallet stays in the
              background – rewards stay in your custody.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
