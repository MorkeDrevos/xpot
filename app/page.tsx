// app/page.tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import JackpotPanel from '@/components/JackpotPanel';
import { ArrowRight, Lock, Sparkles, Activity, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { XpotPageShell } from '@/components/XpotPageShell';

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
    <XpotPageShell>
      {/* Top nav */}
      <header className="sticky top-0 z-30 mb-6 rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-3 backdrop-blur-xl">
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
              . You don&apos;t buy tickets. If you hold the minimum XPOT
              in a self-custody wallet, you can grab a free entry into
              today&apos;s draw and one XPOT holder is selected.
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
                Link your X account on the dashboard and grab today&apos;s
                XPOT entry. One X handle per XPOT identity.
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
                Draw runs once per day. Winner is shown by X handle and
                paid directly in XPOT, on-chain.
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
      <section className="mt-2 border-t border-slate-800/70 pt-6">
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
        {/* ...unchanged Winner + Sponsor + Bottom pillars sections... */}
        {/* (keep exactly what you already have here) */}
      </section>

      {/* Sponsor System */}
      {/* ... existing Sponsor System section ... */}

      {/* Bottom pillars */}
      {/* ... existing Bottom pillars section ... */}
    </XpotPageShell>
  );
}
