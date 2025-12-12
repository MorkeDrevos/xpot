// app/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Lock,
  Sparkles,
  Users,
  ShieldCheck,
  Orbit,
  Zap,
  ExternalLink,
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';

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
  'HypeEngineer',
  'LatencyLord',
  'AlphaSmith',
  'CandleChaser',
];

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition';

function Pill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'sky';
}) {
  const map: Record<string, string> = {
    slate:
      'border-slate-700/70 bg-slate-900/70 text-slate-300 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]',
    emerald:
      'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]',
    amber:
      'border-amber-400/50 bg-amber-500/10 text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.16)]',
    sky: 'border-sky-400/50 bg-sky-500/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.16)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function PremiumCard({
  children,
  className = '',
  halo = true,
}: {
  children: React.ReactNode;
  className?: string;
  halo?: boolean;
}) {
  return (
    <section
      className={[
        'relative overflow-hidden rounded-[30px]',
        'border border-slate-900/70 bg-transparent',
        'shadow-[0_32px_110px_rgba(15,23,42,0.85)] backdrop-blur-xl',
        className,
      ].join(' ')}
    >
      {halo && (
        <div
          className="
            pointer-events-none absolute -inset-28
            bg-[radial-gradient(circle_at_5%_0%,rgba(59,130,246,0.35),transparent_55%),
                radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.26),transparent_58%)]
            opacity-85
          "
        />
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'sky' | 'amber';
}) {
  const toneCls =
    tone === 'emerald'
      ? 'text-emerald-200'
      : tone === 'sky'
      ? 'text-sky-200'
      : tone === 'amber'
      ? 'text-amber-200'
      : 'text-slate-200';

  return (
    <div className="rounded-2xl border border-slate-900/70 bg-slate-950/70 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <div className={`mt-1 font-mono text-sm ${toneCls}`}>{value}</div>
    </div>
  );
}

export default function HomePage() {
  const marquee = useMemo(() => [...SAMPLE_HANDLES], []);

  return (
    <>
      {/* Top nav */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              width={132}
              height={36}
              priority
            />
          </Link>

          <Pill tone="emerald">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            The X-powered reward pool
          </Pill>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-[13px]">
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
            className="group ml-0 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-1.5 text-[13px] font-semibold text-slate-950 shadow-[0_14px_40px_rgba(16,185,129,0.40)] transition hover:bg-emerald-300"
          >
            Enter today&apos;s XPOT
            <ArrowRight className="h-3.5 w-3.5 translate-x-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
        {/* Left */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-slate-700/70">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            Daily on-chain XPOT draw for X-powered holders
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
              NO TICKETS · JUST XPOT HOLDINGS
            </p>

            <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-[3.25rem]">
              The daily on-chain{' '}
              <span className="text-emerald-300">XPOT pool</span> that feels
              like a cockpit.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
              XPOT is a fixed daily pool (for example{' '}
              <span className="font-semibold text-emerald-200">
                1,000,000 XPOT
              </span>
              ). You don&apos;t buy tickets. If you hold the minimum XPOT in a
              self-custody wallet, you can claim a free entry into today&apos;s
              draw and one XPOT holder is selected.
            </p>
          </div>

          {/* Steps (admin-style mini cards) */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-900/70 bg-slate-950/70 px-3.5 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step 1
              </p>
              <p className="mt-1 text-[13px] font-semibold text-slate-50">
                Hold the minimum XPOT
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Keep the threshold amount of XPOT in a self-custody wallet. No
                exchanges.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-900/70 bg-slate-950/70 px-3.5 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step 2
              </p>
              <p className="mt-1 text-[13px] font-semibold text-slate-50">
                Connect X and claim
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Link your X handle on the dashboard and claim today&apos;s entry.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-900/70 bg-slate-950/70 px-3.5 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step 3
              </p>
              <p className="mt-1 text-[13px] font-semibold text-slate-50">
                One holder is picked
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Winner is revealed by X handle and paid directly in XPOT.
              </p>
            </div>
          </div>

          {/* Bonus strip */}
          <div className="pt-1">
            <BonusStrip />
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_rgba(16,185,129,0.45)] transition hover:bg-emerald-300"
            >
              Go to XPOT dashboard
              <ArrowRight className="h-4 w-4 translate-x-0 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <button type="button" className={`${BTN_UTILITY} px-5 py-2.5 text-sm`}>
              Read the system rules
            </button>

            <p className="text-[11px] text-slate-500">
              Winners revealed by <span className="font-semibold text-slate-200">X handle</span>, never by wallet.
            </p>
          </div>
        </div>

        {/* Right: “engine” panel in admin style */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.45),_transparent_55%),radial-gradient(circle_at_80%_100%,_rgba(52,211,153,0.28),_transparent_52%)] opacity-70 blur-3xl" />

          <PremiumCard className="p-5 sm:p-6" halo>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Live XPOT engine
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  The same live panel used inside the Operations Center.
                </p>
              </div>

              <Pill tone="sky">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-pulse" />
                Live feed
              </Pill>
            </div>

            <div className="mt-4">
              <JackpotPanel variant="standalone" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Mode" value="On-chain" tone="emerald" />
              <MiniStat label="Identity" value="@handle" tone="sky" />
              <MiniStat label="Custody" value="Self" tone="amber" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard"
                className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}
              >
                Enter now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-900 transition"
              >
                <Lock className="h-4 w-4 text-amber-200" />
                Operations Center
              </Link>
            </div>
          </PremiumCard>

          <p className="mt-2 text-[11px] text-slate-500">
            You can watch the pool live. Claiming entries happens on the dashboard.
          </p>
        </div>
      </section>

      {/* LIVE HANDLE MARQUEE (admin vibe, premium edges) */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-80 animate-ping" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          </span>
          <span className="font-medium uppercase tracking-[0.18em] text-emerald-300">
            Live: X handles entering today&apos;s XPOT
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-slate-900/70 bg-slate-950/60 px-2 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.85)]">
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#02020a] via-[#02020a]/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#02020a] via-[#02020a]/80 to-transparent" />

          <motion.div
            className="flex gap-3 pr-10"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 42, ease: 'linear', repeat: Infinity }}
          >
            {[0, 1].map(loop => (
              <div key={loop} className="flex gap-3">
                {marquee.map(handle => {
                  const clean = handle.replace(/^@/, '');
                  const initial = clean.charAt(0).toUpperCase();

                  return (
                    <button
                      key={`${loop}-${handle}`}
                      type="button"
                      className="group inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3.5 py-1.5 text-xs text-slate-100/90 shadow-[0_0_0_1px_rgba(15,23,42,0.9)] hover:border-emerald-400/80 hover:bg-slate-900/95 hover:text-slate-50 transition-colors"
                    >
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

      {/* “CONTROL ROOM” WOW SECTION (matches admin aesthetic hard) */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <PremiumCard className="p-5 sm:p-6" halo>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <Pill tone="amber">
                <Lock className="h-3.5 w-3.5" />
                XPOT Control Room
              </Pill>

              <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
                Winners don&apos;t just get paid. They step behind the glass.
              </h2>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                XPOT is built like a system, not a landing page. The Control Room
                is a read-only cockpit view into how the engine moves, with the same
                premium UI you already built in admin.
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 hover:bg-slate-900 transition"
            >
              <Lock className="h-4 w-4 text-amber-200" />
              View operations
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-900/70 bg-slate-950/70 px-4 py-4">
              <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Earned access only
              </p>
              <p className="text-sm text-slate-300">
                No subscriptions, no paywalls. Access is earned by winning.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-900/70 bg-slate-950/70 px-4 py-4">
              <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Orbit className="h-4 w-4 text-sky-300" />
                Live system panels
              </p>
              <p className="text-sm text-slate-300">
                Countdown, rollovers, pool state, internal feed, winner logs.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-900/70 bg-slate-950/70 px-4 py-4">
              <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Zap className="h-4 w-4 text-amber-200" />
                On-chain payouts
              </p>
              <p className="text-sm text-slate-300">
                Winners verify the TX. Transparency is the product.
              </p>
            </div>
          </div>
        </PremiumCard>

        {/* Terminal mock - styled like your admin “premium cockpit” */}
        <PremiumCard className="p-5 sm:p-6" halo={false}>
          <div className="relative overflow-hidden rounded-2xl border border-slate-900/70 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_80%_120%,rgba(34,197,94,0.14),transparent_55%)] p-4 text-[11px] text-emerald-100 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
            <div className="mb-2 flex items-center justify-between text-[10px] text-emerald-200/80">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                CONTROL ROOM · SESSION VIEW
              </span>
              <span className="font-mono text-[10px] text-emerald-200/80">
                read-only
              </span>
            </div>

            <pre className="mt-1 max-h-56 overflow-hidden font-mono text-[10px] leading-relaxed text-emerald-100/90">
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

          <p className="mt-3 text-[12px] text-slate-400">
            Control Room access rolls out in stages. First as a guided read-only
            cockpit, then as a richer XPOT hub with archives, stats and lore.
          </p>
        </PremiumCard>
      </section>

      {/* Bottom pillars (admin-style, tighter, premium) */}
      <section className="mt-8 grid gap-4 border-t border-slate-800/70 pt-6 text-[12px] text-slate-400 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Transparent by design
          </p>
          <p className="mt-1 leading-relaxed">
            XPOT runs on-chain with verifiable entries, draws and payouts. Winners verify TX.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            No ticket sales
          </p>
          <p className="mt-1 leading-relaxed">
            There are no ticket purchases on the site. Holding XPOT is what qualifies you.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Built for X-native holders
          </p>
          <p className="mt-1 leading-relaxed">
            Your X handle is your public identity. Wallet stays in the background, rewards stay in custody.
          </p>
        </div>
      </section>

      <footer className="mt-6 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-slate-400" />
            XPOT is in Pre-Launch Mode. UI is final, wiring continues.
          </span>
          <span className="font-mono text-slate-600">
            build: cinematic-home
          </span>
        </div>
      </footer>
    </>
  );
}
