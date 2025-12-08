// app/page.tsx
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Image from 'next/image';
import JackpotPanel from '@/components/JackpotPanel';
import { ArrowRight, Lock, Sparkles, Activity, Users } from 'lucide-react';
import { motion } from 'framer-motion';

// Temporary sample handles – swap to real API data later
const SAMPLE_HANDLES = [
  'DeWala_222222',
  'CryptoNox',
  'XPOTMaxi',
  'ChartHermit',
  'SolanaSignals',
  'LoopMode',
  'BlockByBlock',
  'FlowStateTrader',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Glow backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.20),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(129,140,248,0.20),_transparent_55%)] opacity-80" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {/* Top nav */}
        <header className="sticky top-4 z-30 mb-4 rounded-2xl border border-slate-800/70 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-flex items-center gap-2">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={112}
                  height={30}
                  priority
                />
              </Link>
              <span className="hidden rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200 sm:inline-flex">
                The X-powered reward pool
              </span>
            </div>

            <nav className="flex items-center gap-3 text-[13px]">
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-1.5 text-slate-300 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/terms"
                className="rounded-full px-3 py-1.5 text-slate-400 hover:text-white/90"
              >
                Terms
              </Link>

              <Link
                href="/dashboard"
                className="group ml-1 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-1.5 text-[13px] font-semibold text-slate-950 shadow-[0_14px_40px_rgba(16,185,129,0.40)] transition hover:bg-emerald-300"
              >
                Enter today&apos;s XPOT
                <ArrowRight className="h-3.5 w-3.5 translate-x-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero + live pool panel */}
        <motion.section
          className="grid flex-1 gap-8 pb-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.1fr)] lg:items-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Left: story */}
          <div className="space-y-7">
            <motion.div
              className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-slate-700/70"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.35 }}
            >
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              Daily on-chain XPOT pool for X-powered holders
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                NO TICKETS · JUST XPOT HOLDINGS
              </p>
              <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-[3.1rem]">
                The daily on-chain{' '}
                <span className="text-emerald-300">XPOT pool</span>{' '}
                for X-powered holders.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
                XPOT is a fixed daily pool – for example{' '}
                <span className="font-semibold text-emerald-200">
                  1,000,000 XPOT
                </span>
                . You don&apos;t buy tickets. If you hold the minimum
                XPOT in a self-custody wallet, you can grab a free entry
                into today&apos;s draw and one XPOT holder is selected.
              </p>
            </motion.div>

            {/* Steps */}
            <motion.div
              className="grid gap-3 sm:grid-cols-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
            >
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 py-3 text-xs shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Step 1
                </p>
                <p className="mt-1 text-[13px] font-semibold text-slate-50">
                  Hold the minimum XPOT
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Keep the threshold amount of XPOT in a self-custody
                  wallet. No custodial accounts, no exchanges.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 py-3 text-xs shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Step 2
                </p>
                <p className="mt-1 text-[13px] font-semibold text-slate-50">
                  Connect X &amp; claim
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Link your X account on the dashboard and grab
                  today&apos;s XPOT entry. One X handle per XPOT
                  identity.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 py-3 text-xs shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Step 3
                </p>
                <p className="mt-1 text-[13px] font-semibold text-slate-50">
                  One XPOT holder is picked
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Draw runs once per day. Winner is shown by X handle
                  and paid directly in XPOT, on-chain.
                </p>
              </div>
            </motion.div>

            {/* CTA + micro copy */}
            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.4 }}
            >
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_rgba(16,185,129,0.45)] transition hover:bg-emerald-300"
              >
                Go to XPOT dashboard
                <ArrowRight className="h-4 w-4 translate-x-0 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <p className="text-[11px] text-slate-500">
                Winners revealed by{' '}
                <span className="font-semibold text-slate-200">
                  X handle
                </span>
                , never by wallet.
              </p>
            </motion.div>
          </div>

          {/* Right: live pool panel */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5, ease: 'easeOut' }}
          >
            <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.50),_transparent_55%),radial-gradient(circle_at_80%_100%,_rgba(52,211,153,0.35),_transparent_52%)] opacity-70 blur-3xl" />
            <div className="jackpot-shell">
              <div className="jackpot-shell-inner">
                <JackpotPanel />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Live XPOT engine – the same panel admins use to monitor
              today&apos;s draw.
            </p>
          </motion.div>
        </motion.section>

        {/* LIVE: X handles entering today’s XPOT */}
        <section className="mt-6 border-t border-slate-800/70 pt-6">
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-80 animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            </span>
            <span className="inline-flex items-center gap-1 font-medium uppercase tracking-[0.18em] text-emerald-300">
              <Activity className="h-3 w-3" />
              Live: X handles entering today&apos;s XPOT
            </span>
          </div>

          <div className="relative overflow-hidden">
            {/* edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent" />

            <motion.div
              className="flex gap-3 pr-10"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
            >
              {[0, 1].map(loop => (
                <div key={loop} className="flex gap-3">
                  {SAMPLE_HANDLES.map(handle => {
                    const clean = handle.replace(/^@/, '');
                    const initial = clean.charAt(0).toUpperCase();

                    return (
                      <button
                        key={`${loop}-${handle}`}
                        type="button"
                        className="group inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3.5 py-1.5 text-xs text-slate-100/90 shadow-[0_0_0_1px_rgba(15,23,42,0.9)] transition-colors hover:border-emerald-400/80 hover:bg-slate-900/95 hover:text-slate-50"
                      >
                        {/* tiny avatar bubble */}
                        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-100">
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                          {initial}
                        </span>
                        <span className="font-mono text-[11px] opacity-80 group-hover:opacity-100">
                          @{clean}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            Handles are shown, wallets stay in self-custody.
          </p>
        </section>

        {/* Winner Control Room section */}
        <section className="mt-10 grid gap-6 rounded-3xl border border-slate-800 bg-slate-950/90 px-5 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
              <Lock className="h-3.5 w-3.5" />
              XPOT Control Room · Winner Access System
            </div>

            <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
              Winners don&apos;t just get paid. They get to step behind
              the curtain.
            </h2>

            <p className="text-sm leading-relaxed text-slate-300">
              Instead of just saying <span className="italic">you won</span>,
              XPOT grants limited access to the{' '}
              <span className="font-semibold">Control Room</span> – a
              read-only view into how the engine moves. It should feel
              like stepping into a private cockpit, not a public website.
            </p>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                  Who gets access?
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  <li className="flex gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                    <span>
                      <span className="font-medium text-slate-100">
                        Daily XPOT winners
                      </span>
                      <br />
                      <span className="text-xs text-slate-400">
                        Each daily pool winner gets limited Control Room
                        access.
                      </span>
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                    <span>
                      <span className="font-medium text-slate-100">
                        Big milestone winners
                      </span>
                      <br />
                      <span className="text-xs text-slate-400">
                        Weekly / monthly specials when XPOT crosses key
                        levels.
                      </span>
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
                    <span>
                      <span className="font-medium text-slate-100">
                        Special guests &amp; sponsors
                      </span>
                      <br />
                      <span className="text-xs text-slate-400">
                        Partners, creators and protocol sponsors invited
                        behind the glass.
                      </span>
                    </span>
                  </li>

                  <li className="mt-2 text-xs text-slate-500">
                    No winners → no room. Access is always earned, never
                    sold.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <Users className="h-3.5 w-3.5 text-sky-300" />
                  What can they see?
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  <li className="flex gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span>
                      <span className="font-medium text-slate-100">
                        Live XPOT pool balance (on-chain)
                      </span>
                      <br />
                      <span className="text-xs text-slate-400">
                        Real-time view of today&apos;s XPOT pool value.
                      </span>
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span>
                      <span className="font-medium text-slate-100">
                        Draw counter &amp; time to next draw
                      </span>
                      <br />
                      <span className="text-xs text-slate-400">
                        Watch the engine countdown in real time.
                      </span>
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span>
                      <span className="font-medium text-slate-100">
                        XPOT distributed &amp; rollovers
                      </span>
                      <br />
                      <span className="text-xs text-slate-400">
                        History of pools, payouts and XPOT emissions.
                      </span>
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span>
                      <span className="font-medium text-slate-100">
                        Internal winner queue
                      </span>
                      <br />
                      <span className="text-xs text-slate-400">
                        View selected winners before they&apos;re
                        published.
                      </span>
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span>
                      <span className="font-medium text-slate-100">
                        System feed (read-only)
                      </span>
                      <br />
                      <span className="text-xs text-slate-400">
                        Watch what the engine does behind the scenes.
                      </span>
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-[12px] text-slate-400">
              We start small, ship the room early, then expand. XPOT
              will keep layering in new panels, lore and visuals as the
              ecosystem grows.
            </p>
          </div>

          {/* Right column – small mock terminal card */}
          <div className="flex flex-col justify-between gap-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_80%_120%,rgba(34,197,94,0.18),transparent_55%)] p-4 text-[11px] text-emerald-100 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
              <div className="mb-2 flex items-center justify-between text-[10px] text-emerald-200/80">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                  CONTROL ROOM · SESSION VIEW
                </span>
                <span className="font-mono text-[10px] text-emerald-200/80">
                  read-only
                </span>
              </div>

              <pre className="mt-1 max-h-40 overflow-hidden font-mono text-[10px] leading-relaxed text-emerald-100/90">
{`> XPOT_POOL_STATUS
  pool_today:      1,000,000 XPOT
  pool_value_usd:  live via Jupiter
  entries_today:   2,184
  next_draw_in:    11:07:43

> LAST_WINNERS
  #2025-12-06  @DeWala_222222   1,000,000 XPOT
  #2025-12-05  @SignalChaser    250,000 XPOT (bonus)
  #2025-12-04  @NFAResearch     1,000,000 XPOT

> note: write access is admin-only. winners can watch, not touch.`}
              </pre>
            </div>

            <p className="text-[12px] text-slate-400">
              Control Room access will roll out to winners in stages.
              First as a guided &quot;read-only cockpit&quot;, then as a
              richer XPOT hub with archives, stats and lore.
            </p>
          </div>
        </section>

        {/* Sponsor System */}
        <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/90 px-5 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                🔥 XPOT Sponsor System
              </div>

              <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">
                Sponsors don&apos;t just buy ads. They fuel the XPOT
                pool.
              </h2>

              <p className="text-sm leading-relaxed text-slate-300">
                Instead of paying for banner space, sponsors purchase
                XPOT and deposit it directly into the reward pool. Every
                sponsored round is fully on-chain, fully visible – and
                tied to a real brand stepping in to boost today&apos;s
                XPOT.
              </p>

              <div className="grid gap-3 text-[12px] text-slate-300 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    For sponsors
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Turn budgets into live XPOT boosts with verifiable
                    TX links instead of vague impressions.
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    For holders
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Bigger daily pools when partners step in. Same
                    rules, same odds – just more XPOT on the line.
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    For XPOT
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Protocol-aligned sponsorships that increase
                    on-chain volume, liquidity and visibility.
                  </p>
                </div>
              </div>
            </div>

            {/* Simple future sponsor slot */}
            <div className="mt-3 w-full max-w-xs rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_80%_120%,rgba(34,197,94,0.18),transparent_55%)] p-4 text-[11px] text-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.9)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Upcoming sponsored rounds
              </p>
              <div className="mt-3 space-y-2 font-mono">
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">2025-12-10</span>
                  <span className="text-emerald-200">TBA partner</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">Pool boost</span>
                  <span className="text-emerald-300">+1,000,000 XPOT</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">Mode</span>
                  <span className="text-slate-200">On-chain deposit</span>
                </p>
              </div>
              <p className="mt-3 text-[10px] text-slate-400">
                Future view: live list of verified sponsors and their
                XPOT deposits for each day&apos;s pool.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom pillars */}
        <section className="mt-6 grid gap-4 border-t border-slate-800 pt-5 text-[12px] text-slate-400 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Transparent by design
            </p>
            <p className="mt-1 leading-relaxed">
              XPOT runs fully on-chain with verifiable entries, draws
              and payouts. Winners can always verify their TX.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              No ticket sales
            </p>
            <p className="mt-1 leading-relaxed">
              There are no ticket purchases on the site. Holding XPOT is
              what qualifies you for the daily pool.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Built for X-native holders
            </p>
            <p className="mt-1 leading-relaxed">
              Your X handle is your public identity. The wallet stays in
              the background – rewards stay in your custody.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
