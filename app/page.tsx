// app/page.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Lock,
  Sparkles,
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';

// Sample handles for testing (replace with API later)
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

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.45)] hover:bg-emerald-300 transition';

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
            bg-[radial-gradient(circle_at_5%_0%,rgba(59,130,246,0.30),transparent_55%),
                radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.22),transparent_58%)]
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

function HandleTicker({ handles }: { handles: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-slate-900/70 bg-slate-950/55 px-2 py-2 shadow-[0_18px_60px_rgba(15,23,42,0.65)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#02020a] via-[#02020a]/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#02020a] via-[#02020a]/80 to-transparent" />

      <motion.div
        className="flex gap-2 pr-10"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 34, ease: 'linear', repeat: Infinity }}
      >
        {[0, 1].map(loop => (
          <div key={loop} className="flex gap-2">
            {handles.map(handle => {
              const clean = handle.replace(/^@/, '');
              const initial = clean.charAt(0).toUpperCase();

              return (
                <div
                  key={`${loop}-${handle}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-100/90 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]"
                >
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-100">
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                    {initial}
                  </span>
                  <span className="font-mono text-[11px] opacity-80">@{clean}</span>
                </div>
              );
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const marquee = useMemo(() => [...SAMPLE_HANDLES], []);
  const [showLiveEntries, setShowLiveEntries] = useState(false);

  return (
    <XpotPageShell>
      {/* ONE MAIN STORY ABOVE THE FOLD: MEGA HERO */}
      <section className="mt-6">
        <div className="relative overflow-hidden rounded-[36px] border border-slate-900/70 bg-slate-950/45 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur-xl">
          {/* Cinematic halo */}
          <div
            className="
              pointer-events-none absolute -inset-40 opacity-80 blur-3xl
              bg-[radial-gradient(circle_at_10%_10%,rgba(16,185,129,0.22),transparent_55%),
                  radial-gradient(circle_at_90%_20%,rgba(56,189,248,0.22),transparent_55%),
                  radial-gradient(circle_at_80%_90%,rgba(236,72,153,0.18),transparent_60%)]
            "
          />

          <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:p-8">
            {/* LEFT: slogan + 1-line + 1 primary CTA */}
            <div className="flex flex-col justify-between gap-6">
              <div className="space-y-5">
<Pill tone="sky">
  <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
  Identity: @handle
</Pill>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                    NO TICKETS · JUST XPOT HOLDINGS
                  </p>

                  <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight sm:text-5xl">
                    One protocol. One identity.{' '}
                    <span className="text-emerald-300">One daily XPOT draw.</span>
                  </h1>

                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
                    Hold XPOT, connect X, claim your entry. One winner daily, paid on-chain.
                  </p>
                </div>

                {/* BonusStrip stays (visual, not essay) */}
                <div className="pt-1">
                  <BonusStrip />
                </div>

                {/* Primary CTA + secondary */}
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/dashboard" className={`${BTN_GREEN} px-5 py-2.5 text-sm`}>
                    Enter today&apos;s XPOT
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link href="/terms" className={`${BTN_UTILITY} px-5 py-2.5 text-sm`}>
                    Terms
                  </Link>

                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-5 py-2.5 text-sm text-slate-200 hover:bg-slate-900 transition"
                  >
                    <Lock className="h-4 w-4 text-amber-200" />
                    Operations Center
                  </Link>

                  <p className="text-[11px] text-slate-500">
                    Winners revealed by{' '}
                    <span className="font-semibold text-slate-200">X handle</span>, never by wallet.
                  </p>
                </div>
              </div>

              {/* Mini stats (scanable) */}
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniStat label="Mode" value="On-chain" tone="emerald" />
                <MiniStat label="Identity" value="@handle" tone="sky" />
                <MiniStat label="Custody" value="Self" tone="amber" />
              </div>
            </div>

            {/* RIGHT: cockpit module = JackpotPanel + Control Room */}
            <div className="grid gap-4">
              <PremiumCard className="p-5 sm:p-6" halo>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Live XPOT engine</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Live pool value and milestones (via Jupiter).
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

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href="/dashboard" className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}>
                    Enter now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>

                  <span className="text-[11px] text-slate-500">
                    Watch live here. Claim entries on the dashboard.
                  </span>
                </div>
              </PremiumCard>

              <PremiumCard className="p-5 sm:p-6" halo={false}>
                <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-emerald-200/80">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                    Control Room - session view
                  </span>
                  <span className="font-mono text-emerald-200/70">read-only</span>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-slate-900/70 bg-slate-950/70 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
                  <div
                    className="
                      pointer-events-none absolute -inset-24 opacity-70 blur-3xl
                      bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.18),transparent_55%),
                          radial-gradient(circle_at_90%_100%,rgba(56,189,248,0.14),transparent_60%)]
                    "
                  />

                  <pre className="relative z-10 max-h-56 overflow-hidden font-mono text-[11px] leading-relaxed text-emerald-100/90">
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
                  Read-only cockpit view. Same panels as ops. Winners get access.
                </p>
              </PremiumCard>
            </div>
          </div>

          {/* OPTIONAL: expandable live entries (keeps wow without noise) */}
          <div className="relative z-10 border-t border-slate-900/70 px-6 py-4 lg:px-8">
            <button
              type="button"
              onClick={() => setShowLiveEntries(v => !v)}
              className="group inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-900/70 bg-slate-950/50 px-4 py-3 text-left shadow-[0_18px_60px_rgba(15,23,42,0.55)] transition hover:bg-slate-950/70"
            >
              <span className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-70 animate-ping" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Live entries (X handles)
                </span>
                <span className="text-[11px] text-slate-500">
                  Optional - expand to view
                </span>
              </span>

              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  showLiveEntries ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {showLiveEntries && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3">
                    <HandleTicker handles={marquee} />
                    <p className="mt-2 text-[11px] text-slate-500">
                      Handles are shown, wallets stay in self-custody.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* WOW FACTOR SECTION (minimal, scanable): THE PROTOCOL STRIP */}
      <section className="mt-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="emerald">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              Qualification
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">
              No purchases. No tickets.
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Holding XPOT is the only requirement to enter.
            </p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="sky">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
              Identity
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">
              Public by handle.
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Your X handle is the public identity. Wallet stays private.
            </p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="amber">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
              Payout
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">
              Paid on-chain in XPOT.
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Winner verifies the transaction. Transparency is the product.
            </p>
          </PremiumCard>
        </div>
      </section>

      {/* Tiny footer (no essay) */}
      <footer className="mt-8 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-slate-400" />
            Pre-Launch Mode. UI is final, wiring continues.
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-900 transition"
            >
              <Lock className="h-3.5 w-3.5 text-amber-200" />
              Ops
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </Link>

            <span className="font-mono text-slate-600">build: cinematic-home</span>
          </div>
        </div>
      </footer>
    </XpotPageShell>
  );
}
