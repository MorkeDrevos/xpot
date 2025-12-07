'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Background orbits / glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_55%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Top nav */}
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-2xl border border-emerald-400/60 bg-slate-900/80 shadow-[0_0_30px_rgba(16,185,129,0.45)]">
              <div className="absolute inset-[2px] rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-300 to-amber-300" />
              <div className="relative flex h-full items-center justify-center text-xs font-semibold text-slate-950">
                XP
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-[0.22em] text-slate-300">
                XPOT
              </span>
              <span className="text-xs text-slate-500">Daily on-chain jackpot flow</span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link href="#how" className="transition hover:text-slate-50">
              How it works
            </Link>
            <Link href="#why" className="transition hover:text-slate-50">
              Why XPOT
            </Link>
            <Link href="#sponsors" className="transition hover:text-slate-50">
              For sponsors
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-xs font-medium text-slate-100 shadow-sm backdrop-blur-md transition hover:border-emerald-400/80 hover:bg-slate-900/90"
            >
              Open dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_30px_rgba(52,211,153,0.65)] transition hover:bg-emerald-300 md:inline-flex"
            >
              Enter today&apos;s draw
            </Link>
          </div>
        </header>

        {/* Hero */}
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col-reverse gap-10 px-6 pb-16 pt-4 lg:flex-row lg:items-center">
          {/* Left column */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
            className="w-full lg:w-[54%]"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-emerald-200 backdrop-blur">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              <span>Live XPOT draws every day</span>
              <span className="h-3 w-px bg-emerald-400/30" />
              <span className="text-slate-400">No tickets. Just holders.</span>
            </div>

            <h1 className="mb-5 text-balance text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
              A daily jackpot layer
              <span className="block bg-gradient-to-r from-emerald-300 via-emerald-100 to-amber-200 bg-clip-text text-transparent">
                built for crypto natives
              </span>
            </h1>

            <p className="mb-7 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              XPOT turns holding into a ritual. Meet the on-chain jackpot flow where your X account is your identity,
              your wallet stays yours, and every day someone walks away with a serious XPOT win.
            </p>

            <div className="mb-7 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(52,211,153,0.80)] transition hover:bg-emerald-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-300 via-emerald-100 to-amber-200 opacity-0 transition group-hover:opacity-100" />
                <span className="relative">Enter today&apos;s draw</span>
                <span className="relative text-xs text-slate-900/80">under 15 seconds</span>
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center text-xs font-medium text-slate-300 hover:text-emerald-200"
              >
                View live dashboard
                <span className="ml-2 text-[11px] opacity-70">↗</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[9px] font-semibold text-slate-200">
                    @
                  </span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[9px] font-semibold text-slate-200">
                    X
                  </span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[9px] font-semibold text-slate-200">
                    ⚡
                  </span>
                </div>
                <span>One XPOT identity per X account. Winner shown by handle.</span>
              </div>

              <div className="hidden h-3 w-px bg-slate-700/80 sm:block" />

              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Self-custody. No tickets. No deposits.</span>
              </div>
            </div>
          </motion.section>

          {/* Right column: XPOT live card */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
            className="w-full lg:w-[46%]"
          >
            <div className="relative mx-auto max-w-md">
              {/* Outer glow ring */}
              <div className="pointer-events-none absolute -inset-0.5 rounded-3xl bg-gradient-to-tr from-emerald-400/80 via-emerald-200/60 to-amber-300/70 opacity-60 blur-2xl" />

              <div className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-950/90 shadow-[0_30px_80px_rgba(15,23,42,0.9)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.18),_transparent_55%)]" />

                <div className="relative flex flex-col gap-4 p-6">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-emerald-500 text-xs font-semibold text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.85)]">
                        XP
                      </div>
                      <div className="flex flex-col text-xs">
                        <span className="text-[11px] uppercase tracking-[0.26em] text-emerald-200">
                          Today&apos;s XPOT
                        </span>
                        <span className="text-slate-400">Live draw cycle</span>
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-400/40 bg-slate-950/70 px-3 py-1 text-[10px] font-medium text-emerald-100">
                      Closes in &bull; 03:14:27
                    </div>
                  </div>

                  {/* Jackpot numbers */}
                  <div className="mt-1 flex flex-col gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Est. jackpot
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="bg-gradient-to-r from-emerald-200 via-emerald-50 to-amber-200 bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
                        1,000,000
                      </span>
                      <span className="text-sm font-medium text-emerald-200">XPOT</span>
                    </div>
                    <div className="flex items-baseline gap-3 text-xs text-slate-400">
                      <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px] text-emerald-100">
                        ≈ $24,180 pool value
                      </span>
                      <span className="hidden text-slate-500 sm:inline">
                        Auto-verified on Solana
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-2xl bg-slate-900/80 p-3 ring-1 ring-slate-800/80">
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        Today&apos;s entries
                      </div>
                      <div className="text-lg font-semibold text-slate-50">1,284</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">Unique XPOT handles</div>
                    </div>

                    <div className="rounded-2xl bg-slate-900/80 p-3 ring-1 ring-slate-800/80">
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        Rollover
                      </div>
                      <div className="text-lg font-semibold text-emerald-200">+320k</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">Carried from yesterday</div>
                    </div>

                    <div className="rounded-2xl bg-slate-900/80 p-3 ring-1 ring-slate-800/80">
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        Last winner
                      </div>
                      <div className="truncate text-sm font-semibold text-slate-50">
                        @orbit_native
                      </div>
                      <div className="mt-0.5 text-[10px] text-emerald-200">740k XPOT claimed</div>
                    </div>
                  </div>

                  {/* Recent entrants strip */}
                  <div className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3 text-[11px]">
                    <div className="mb-2 flex items-center justify-between text-slate-400">
                      <span>Live: X accounts entering now</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                        Streaming
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="truncate">@nightshift_builds</span>
                        <span className="text-[10px] text-slate-500">+3 draws locked</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="truncate">@solana_whale</span>
                        <span className="text-[10px] text-slate-500">new to XPOT</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="truncate">@degensniper</span>
                        <span className="text-[10px] text-slate-500">streak: 7 days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </main>

        {/* How it works */}
        <section id="how" className="relative border-t border-slate-900/80 bg-slate-950/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.26),_transparent_60%)] opacity-60" />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row lg:items-start">
            <div className="w-full max-w-md lg:w-[40%]">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-emerald-200">
                How XPOT works
              </h2>
              <p className="mb-4 text-2xl font-semibold tracking-tight text-slate-50">
                No tickets. No forms. Just hold and grab your daily XPOT entry.
              </p>
              <p className="text-sm text-slate-300">
                XPOT runs on a simple ritual. Connect your wallet, verify with your X account once, and from that moment
                you can pick up your daily entry in a few seconds as long as you keep the minimum XPOT balance.
              </p>
            </div>

            <div className="grid w-full flex-1 gap-4 sm:grid-cols-3">
              <div className="group flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-950/90 p-4 text-sm shadow-[0_20px_60px_rgba(15,23,42,0.9)] transition hover:border-emerald-400/60 hover:shadow-[0_20px_70px_rgba(16,185,129,0.55)]">
                <div>
                  <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] text-emerald-300 ring-1 ring-emerald-500/50">
                    1
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-slate-50">Hold the minimum XPOT</h3>
                  <p className="text-xs text-slate-300">
                    Pick your XPOT position wherever you like to trade. As long as your balance stays above the
                    minimum, you are eligible for today&apos;s draw.
                  </p>
                </div>
                <div className="mt-3 text-[11px] text-emerald-200">No lockups. Wallet stays 100% yours.</div>
              </div>

              <div className="group flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-950/90 p-4 text-sm shadow-[0_20px_60px_rgba(15,23,42,0.9)] transition hover:border-emerald-400/60 hover:shadow-[0_20px_70px_rgba(16,185,129,0.55)]">
                <div>
                  <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] text-emerald-300 ring-1 ring-emerald-500/50">
                    2
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-slate-50">Grab your daily entry</h3>
                  <p className="text-xs text-slate-300">
                    Once per draw, you tap &quot;Claim today&apos;s XPOT entry&quot; in the dashboard. That entry is tied to your
                    X handle, not your wallet address.
                  </p>
                </div>
                <div className="mt-3 text-[11px] text-emerald-200">Zero ticket payments. Zero custody risk.</div>
              </div>

              <div className="group flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-950/90 p-4 text-sm shadow-[0_20px_60px_rgba(15,23,42,0.9)] transition hover:border-emerald-400/60 hover:shadow-[0_20px_70px_rgba(16,185,129,0.55)]">
                <div>
                  <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] text-emerald-300 ring-1 ring-emerald-500/50">
                    3
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-slate-50">Daily on-chain draws</h3>
                  <p className="text-xs text-slate-300">
                    Each draw picks one winning entry. Everything is recorded on-chain, the reward is paid in XPOT, and
                    rollovers stack when no winner claims.
                  </p>
                </div>
                <div className="mt-3 text-[11px] text-emerald-200">Draw history you can actually verify.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why XPOT */}
        <section id="why" className="relative border-t border-slate-900/80 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(8,47,73,0.7),_transparent_60%)] opacity-70" />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-start">
            <div className="w-full max-w-md lg:w-[42%]">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-emerald-200">
                Why XPOT feels different
              </h2>
              <p className="mb-4 text-2xl font-semibold tracking-tight text-slate-50">
                Designed for people who already live on Solana, X and real on-chain flows.
              </p>
              <p className="text-sm text-slate-300">
                XPOT is not a casino skin on top of crypto. It is a native layer for daily jackpots where the vibe,
                the UX, and the mechanics match how we already trade, gather and play.
              </p>
            </div>

            <div className="grid w-full flex-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-800/90 bg-slate-950/90 p-4 text-sm shadow-[0_20px_60px_rgba(15,23,42,0.9)]">
                <h3 className="text-sm font-semibold text-slate-50">Identity by X handle</h3>
                <p className="text-xs text-slate-300">
                  Winners and entrants are shown by their X accounts, not by anonymous hex strings. The community sees
                  real handles winning in real time.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-slate-800/90 bg-slate-950/90 p-4 text-sm shadow-[0_20px_60px_rgba(15,23,42,0.9)]">
                <h3 className="text-sm font-semibold text-slate-50">Self-custody by default</h3>
                <p className="text-xs text-slate-300">
                  XPOT does not touch your funds. You keep your XPOT in your own wallet or CEX. The system just checks
                  if you qualify at the moment you grab your entry.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-slate-800/90 bg-slate-950/90 p-4 text-sm shadow-[0_20px_60px_rgba(15,23,42,0.9)]">
                <h3 className="text-sm font-semibold text-slate-50">Transparent draw engine</h3>
                <p className="text-xs text-slate-300">
                  Every draw, entry, and winner can be traced. XPOT treats transparency like a design feature, not a
                  legal afterthought.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-slate-800/90 bg-slate-950/90 p-4 text-sm shadow-[0_20px_60px_rgba(15,23,42,0.9)]">
                <h3 className="text-sm font-semibold text-slate-50">Built for daily rhythm</h3>
                <p className="text-xs text-slate-300">
                  XPOT is intentionally light friction. It should feel like checking price, scanning your feed, and
                  claiming a ritual you actually look forward to.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sponsors */}
        <section id="sponsors" className="relative border-t border-slate-900/80 bg-slate-950/95">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(250,204,21,0.18),_transparent_60%)] opacity-80" />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center">
            <div className="w-full max-w-md lg:w-[45%]">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-amber-200">
                For partners and sponsors
              </h2>
              <p className="mb-4 text-2xl font-semibold tracking-tight text-slate-50">
                Plug your brand into a daily jackpot stream with on-chain proof of every payout.
              </p>
              <p className="mb-4 text-sm text-slate-300">
                Sponsors fund a slice of the daily XPOT pool by buying XPOT and depositing it into the reward wallet.
                The impact is visible in real time in the dashboard and on-chain explorers.
              </p>
              <ul className="mb-5 space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2 text-xs">
                  <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Co-branded days and sponsored streaks for your community.
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Verifiable, on-chain proof of every sponsored reward.
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Native to X conversations, spaces and streams.
                </li>
              </ul>
              <p className="text-xs text-slate-400">
                If you are a protocol, exchange, or community wanting to headline a run of XPOT draws, reach out and
                we will open up the sponsor panel for you.
              </p>
            </div>

            <div className="w-full flex-1">
              <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border border-amber-300/40 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-950/95 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.9)]">
                <div className="mb-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-300/95 text-[11px] font-semibold text-slate-950">
                      ★
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-amber-100">
                        Sponsor control
                      </span>
                      <span className="text-slate-400">Preview of the sponsor console</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300">
                    Coming soon
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-950/80 p-3 ring-1 ring-slate-800/90">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-400">Today&apos;s sponsored pool</span>
                      <span className="text-base font-semibold text-amber-100">+250,000 XPOT</span>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>Funded by</div>
                      <div className="text-sm font-semibold text-slate-50">@YourProtocol</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-950/80 p-3 ring-1 ring-slate-800/90">
                      <div className="mb-1 text-[11px] text-slate-400">Campaign window</div>
                      <div className="text-sm font-semibold text-slate-50">7 draws</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">One headline per day</div>
                    </div>
                    <div className="rounded-2xl bg-slate-950/80 p-3 ring-1 ring-slate-800/90">
                      <div className="mb-1 text-[11px] text-slate-400">Reach potential</div>
                      <div className="text-sm font-semibold text-slate-50">X + Telegram</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">Native to degen flows</div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-950/80 p-3 ring-1 ring-slate-800/90 text-[11px] text-slate-300">
                    <div className="mb-1 flex items-center justify-between">
                      <span>What your team gets</span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                        XPOT native placement
                      </span>
                    </div>
                    <ul className="list-disc space-y-1 pl-4">
                      <li>Named jackpot on the day you sponsor.</li>
                      <li>On-chain record of every sponsored win.</li>
                      <li>Visibility in the XPOT dashboard and daily recap posts.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-slate-900/80 bg-slate-950">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/90 px-4 py-1 text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              <span>XPOT is in active build. Early days, serious intentions.</span>
            </div>

            <h2 className="max-w-2xl text-balance text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Ready to make a daily jackpot ritual part of your crypto life?
            </h2>

            <p className="max-w-xl text-sm text-slate-300">
              Connect your wallet, link your X, and grab today&apos;s entry. XPOT is built to feel premium, honest and
              native to the way we already move on Solana.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(52,211,153,0.8)] transition hover:bg-emerald-300"
              >
                Open XPOT dashboard
              </Link>
              <Link
                href="/admin"
                className="text-xs font-medium text-slate-400 hover:text-emerald-200"
              >
                Admin & control room ↗
              </Link>
            </div>

            <p className="pt-3 text-[10px] text-slate-500">
              XPOT is a utility token and this interface is an experiment in on-chain jackpot flows. It is not a casino
              or a guaranteed income product. Always DYOR.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
