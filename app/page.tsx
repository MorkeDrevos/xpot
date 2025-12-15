// app/page.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  Copy,
  ExternalLink,
  Lock,
  Sparkles,
  Check,
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';

// ─────────────────────────────────────────────
// Routes (fix broken links)
// ─────────────────────────────────────────────
const ROUTE_HUB = '/hub';
const ROUTE_OPS = '/ops';
const ROUTE_TERMS = '/terms';

// Contract / CA (display + copy)
const XPOT_CA = 'So11111111111111111111111111111111111111112';

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
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-lime-300 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.22)] hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-emerald-300 text-slate-950 font-semibold shadow-[0_18px_70px_rgba(16,185,129,0.28)] hover:bg-emerald-200 transition';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-emerald-400/25 text-emerald-100/90 bg-emerald-950/10 hover:bg-emerald-900/20 transition';

function Pill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'sky';
}) {
  const map: Record<string, string> = {
    slate:
      'border-emerald-500/18 bg-emerald-950/25 text-emerald-100/80 shadow-[0_0_0_1px_rgba(16,185,129,0.10)]',
    emerald:
      'border-emerald-400/30 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.16)]',
    amber:
      'border-lime-300/25 bg-lime-400/10 text-lime-200 shadow-[0_0_0_1px_rgba(163,230,53,0.12)]',
    sky: 'border-emerald-400/22 bg-emerald-500/8 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]',
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
        'border border-emerald-500/14 bg-[#01040a]/40',
        'shadow-[0_30px_110px_rgba(0,0,0,0.68)] backdrop-blur-xl',
        className,
      ].join(' ')}
    >
      {/* CRT scanlines */}
      <div
        className="
          pointer-events-none absolute inset-0 opacity-[0.16]
          [background:repeating-linear-gradient(to_bottom,rgba(16,185,129,0.10),rgba(16,185,129,0.10)_1px,transparent_1px,transparent_6px)]
        "
      />
      {halo && (
        <div
          className="
            pointer-events-none absolute -inset-28
            bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.34),transparent_55%),
                radial-gradient(circle_at_100%_100%,rgba(163,230,53,0.14),transparent_58%)]
            opacity-80 blur-2xl
          "
        />
      )}
      {/* subtle border glow */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.10)]" />
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
      ? 'text-emerald-100'
      : tone === 'amber'
      ? 'text-lime-200'
      : 'text-emerald-100/90';

  return (
    <div className="rounded-2xl border border-emerald-500/14 bg-emerald-950/18 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
      <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-100/45">
        {label}
      </p>
      <div className={`mt-1 font-mono text-sm ${toneCls}`}>{value}</div>
    </div>
  );
}

function HandleTicker({ handles }: { handles: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-emerald-500/14 bg-emerald-950/18 px-2 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#01040a] via-[#01040a]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#01040a] via-[#01040a]/70 to-transparent" />

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
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/16 bg-emerald-950/25 px-3 py-1.5 text-xs text-emerald-50/90 shadow-[0_0_0_1px_rgba(16,185,129,0.10)]"
                >
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-emerald-950/50 text-[11px] font-semibold text-emerald-100 border border-emerald-400/18">
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.65)]" />
                    {initial}
                  </span>
                  <span className="font-mono text-[11px] opacity-85">@{clean}</span>
                </div>
              );
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function shortenAddress(addr: string, left = 6, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

function ContractPill({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/18 bg-emerald-950/22 px-3 py-1 text-[11px] text-emerald-100/80 shadow-[0_0_0_1px_rgba(16,185,129,0.10)]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/50">
          CA
        </span>
        <span className="font-mono text-[11px] text-emerald-100">
          {shortenAddress(address, 10, 10)}
        </span>
      </span>

      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-2 rounded-full border border-emerald-500/18 bg-emerald-950/22 px-3 py-1 text-[11px] text-emerald-100/80 hover:bg-emerald-900/20 transition"
        title="Copy contract address"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-200" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 text-emerald-100/55" />
            Copy
          </>
        )}
      </button>
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
        <div className="relative overflow-hidden rounded-[36px] border border-emerald-500/16 bg-[#01040a]/55 shadow-[0_40px_140px_rgba(0,0,0,0.72)] backdrop-blur-xl">
          {/* scanlines */}
          <div
            className="
              pointer-events-none absolute inset-0 opacity-[0.12]
              [background:repeating-linear-gradient(to_bottom,rgba(16,185,129,0.10),rgba(16,185,129,0.10)_1px,transparent_1px,transparent_7px)]
            "
          />

          {/* Matrix halo */}
          <div
            className="
              pointer-events-none absolute -inset-40 opacity-85 blur-3xl
              bg-[radial-gradient(circle_at_12%_10%,rgba(16,185,129,0.32),transparent_55%),
                  radial-gradient(circle_at_88%_18%,rgba(163,230,53,0.16),transparent_55%),
                  radial-gradient(circle_at_70%_92%,rgba(16,185,129,0.12),transparent_60%)]
            "
          />

          {/* subtle inner border */}
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.10)]" />

          <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:p-8">
            {/* LEFT */}
            <div className="flex flex-col justify-between gap-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="emerald">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
                    Identity: @handle
                  </Pill>
                  <Pill tone="slate">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
                    Protocol layer
                  </Pill>
                </div>

                <div>
                  {/* DO NOT CHANGE THIS SLOGAN */}
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-100/55">
                    NO TICKETS · JUST XPOT HOLDINGS
                  </p>

                  {/* DO NOT CHANGE THIS SLOGAN */}
                  <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight sm:text-5xl">
                    One protocol. One identity.{' '}
                    <span className="text-emerald-200">One daily XPOT draw.</span>
                  </h1>

                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-100/80">
                    Hold XPOT, connect X, claim your entry. One winner daily, paid on-chain.
                    <span className="ml-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/18 bg-emerald-950/18 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                      Terminal-grade transparency
                    </span>
                  </p>
                </div>

                {/* BonusStrip */}
                <div className="pt-1">
                  <BonusStrip />
                </div>

                <ContractPill address={XPOT_CA} />

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-5 py-2.5 text-sm`}>
                    Enter today&apos;s XPOT
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link href={ROUTE_TERMS} className={`${BTN_UTILITY} px-5 py-2.5 text-sm`}>
                    Terms
                  </Link>

                  <Link
                    href={ROUTE_OPS}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/18 bg-emerald-950/18 px-5 py-2.5 text-sm text-emerald-100/90 hover:bg-emerald-900/20 transition"
                  >
                    <Lock className="h-4 w-4 text-emerald-200" />
                    Operations Center
                  </Link>

                  <p className="text-[11px] text-emerald-100/45">
                    Winners revealed by{' '}
                    <span className="font-semibold text-emerald-100/90">X handle</span>, never by wallet.
                  </p>
                </div>
              </div>

              {/* Mini stats */}
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniStat label="Mode" value="On-chain" tone="emerald" />
                <MiniStat label="Identity" value="@handle" tone="sky" />
                <MiniStat label="Custody" value="Self" tone="amber" />
              </div>
            </div>

            {/* RIGHT */}
            <div className="grid gap-4">
              <PremiumCard className="p-5 sm:p-6" halo>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-50">
                      Live XPOT engine
                    </p>
                    <p className="mt-1 text-xs text-emerald-100/45">
                      Live pool value and milestones (via Jupiter).
                    </p>
                  </div>

                  <Pill tone="emerald">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.75)] animate-pulse" />
                    Live feed
                  </Pill>
                </div>

                <div className="mt-4">
                  <JackpotPanel variant="standalone" />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href={ROUTE_HUB} className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}>
                    Enter now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>

                  <span className="text-[11px] text-emerald-100/45">
                    Watch live here. Claim entries in the hub.
                  </span>
                </div>
              </PremiumCard>

              <PremiumCard className="p-5 sm:p-6" halo={false}>
                <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-emerald-200/80">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
                    Control Room - session view
                  </span>
                  <span className="font-mono text-emerald-200/60">read-only</span>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-emerald-400/18 bg-emerald-950/18 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.60)]">
                  <div
                    className="
                      pointer-events-none absolute -inset-24 opacity-80 blur-3xl
                      bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.34),transparent_55%),
                          radial-gradient(circle_at_90%_100%,rgba(163,230,53,0.12),transparent_60%)]
                    "
                  />
                  <div
                    className="
                      pointer-events-none absolute inset-0 opacity-[0.14]
                      [background:repeating-linear-gradient(to_bottom,rgba(16,185,129,0.12),rgba(16,185,129,0.12)_1px,transparent_1px,transparent_6px)]
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

                <p className="mt-3 text-[12px] text-emerald-100/45">
                  Read-only cockpit view. Same panels as ops. Winners get access.
                </p>
              </PremiumCard>
            </div>
          </div>

          {/* OPTIONAL: expandable live entries */}
          <div className="relative z-10 border-t border-emerald-500/14 px-6 py-4 lg:px-8">
            <button
              type="button"
              onClick={() => setShowLiveEntries(v => !v)}
              className="group inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-emerald-500/14 bg-emerald-950/18 px-4 py-3 text-left shadow-[0_18px_60px_rgba(0,0,0,0.50)] transition hover:bg-emerald-900/20"
            >
              <span className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-emerald-300 opacity-70 animate-ping" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Live entries (X handles)
                </span>
                <span className="text-[11px] text-emerald-100/40">Optional - expand to view</span>
              </span>

              <ChevronDown
                className={`h-4 w-4 text-emerald-100/55 transition-transform ${
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
                    <p className="mt-2 text-[11px] text-emerald-100/45">
                      Handles are shown, wallets stay in self-custody.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* WOW FACTOR SECTION: THE PROTOCOL STRIP */}
      <section className="mt-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="emerald">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
              Qualification
            </Pill>
            <p className="mt-3 text-lg font-semibold text-emerald-50">
              No purchases. No tickets.
            </p>
            <p className="mt-2 text-sm text-emerald-100/70">
              Holding XPOT is the only requirement to enter.
            </p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="sky">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
              Identity
            </Pill>
            <p className="mt-3 text-lg font-semibold text-emerald-50">
              Public by handle.
            </p>
            <p className="mt-2 text-sm text-emerald-100/70">
              Your X handle is the public identity. Wallet stays private.
            </p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="amber">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.60)]" />
              Payout
            </Pill>
            <p className="mt-3 text-lg font-semibold text-emerald-50">
              Paid on-chain in XPOT.
            </p>
            <p className="mt-2 text-sm text-emerald-100/70">
              Winner verifies the transaction. Transparency is the product.
            </p>
          </PremiumCard>
        </div>
      </section>

      {/* Tiny footer */}
      <footer className="mt-8 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-emerald-100/45">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-100/55" />
            Pre-Launch Mode. UI is final, wiring continues.
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={ROUTE_OPS}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/18 bg-emerald-950/18 px-3 py-1.5 text-[11px] text-emerald-100/80 hover:bg-emerald-900/20 transition"
            >
              <Lock className="h-3.5 w-3.5 text-emerald-200" />
              Ops
              <ExternalLink className="h-3.5 w-3.5 text-emerald-100/45" />
            </Link>

            <span className="font-mono text-emerald-100/35">build: matrix-home</span>
          </div>
        </div>
      </footer>
    </XpotPageShell>
  );
}
