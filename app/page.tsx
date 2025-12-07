// app/page.tsx

import Link from 'next/link';
import Image from 'next/image';
import JackpotPanel from '@/components/JackpotPanel';
import { ArrowRight, Lock, Sparkles, Activity, Users } from 'lucide-react';

// Temporary sample handles – swap to real API data later
const SAMPLE_HANDLES = [
  '@DeWala_222222',
  '@CryptoNox',
  '@XPOTMaxi',
  '@ChartHermit',
  '@SolanaSignals',
  '@LoopMode',
  '@BlockByBlock',
  '@FlowStateTrader',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Glow backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.20),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(129,140,248,0.20),_transparent_55%)] opacity-80" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {/* Top nav */}
        <header className="flex items-center justify-between gap-4 pb-6">
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
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
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
        </header>

        {/* Hero + Jackpot */}
        <section className="grid flex-1 gap-8 pb-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.1fr)] lg:items-center">
          {/* Left: story */}
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-slate-700/70">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              Daily on-chain XPOT draw for X-powered holders
            </div>

            <div>
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
            </div>

            {/* Steps */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 py-3 text-xs shadow-sm">
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

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 py-3 text-xs shadow-sm">
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

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 py-3 text-xs shadow-sm">
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
            </div>

            {/* CTA + micro copy */}
            <div className="flex flex-wrap items-center gap-4">
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
            </div>
          </div>

          {/* Right: live jackpot panel */}
          <div className="relative">
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
          </div>
        </section>

        {/* X-powered entry feed */}
        <section className="mb-8 mt-2 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Activity className="h-4 w-4 text-emerald-300" />
              <span className="uppercase tracking-[0.16em] text-slate-400">
                Live: X handles entering today&apos;s XPOT
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Handles are shown, wallets stay in self-custody.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/85 px-3 py-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-950 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent" />

            <div className="flex animate-[marquee_26s_linear_infinite] gap-2 whitespace-nowrap text-xs">
              {SAMPLE_HANDLES.concat(SAMPLE_HANDLES).map((h, idx) => (
                <span
                  key={`${h}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-[11px] text-slate-200"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {h}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Winner Control Room section */}
        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-950/90 px-5 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
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
                <ul className="space-y-1.5 text-[12px] text-slate-300">
                  <li>✅ Daily XPOT winners</li>
                  <li>✅ Big milestone winners (weekly / monthly)</li>
                  <li>✅ Special guests – sponsors, partners, creators</li>
                  <li className="pt-1 text-slate-500">
                    No winners → no room.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <Users className="h-3.5 w-3.5 text-sky-300" />
                  What can they see?
                </p>
                <ul className="space-y-1.5 text-[12px] text-slate-300">
                  <li>✅ Real jackpot pool balance (on-chain)</li>
                  <li>✅ Live draw counter &amp; time to next draw</li>
                  <li>✅ Rollover history &amp; XPOT distributed</li>
                  <li>✅ Last winners list before public posting</li>
                  <li>✅ Behind-the-scenes system events feed</li>
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
{`> JACKPOT_STATUS
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
