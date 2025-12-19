// app/tokenomics/page.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  Crown,
  ExternalLink,
  Flame,
  Gift,
  Lock,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

import XpotPageShell from '@/components/XpotPageShell';

type PillTone = 'slate' | 'emerald' | 'amber' | 'sky';

const ROUTE_HUB = '/hub';
const ROUTE_TERMS = '/terms';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition';

const CARD =
  'relative overflow-hidden rounded-[30px] border border-slate-900/70 bg-slate-950/45 shadow-[0_40px_140px_rgba(0,0,0,0.55)] backdrop-blur-xl';

function Pill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: PillTone;
}) {
  const map: Record<PillTone, string> = {
    slate:
      'border-slate-800/70 bg-slate-900/60 text-slate-200 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]',
    emerald:
      'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]',
    amber:
      'border-amber-400/50 bg-amber-500/10 text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.16)]',
    sky: 'border-sky-400/50 bg-sky-500/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.16)]',
  };

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
        map[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function Money({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <div className="font-mono text-2xl font-semibold text-slate-100 sm:text-3xl">
      {value}
      {suffix ? <span className="ml-2 text-sm text-slate-400">{suffix}</span> : null}
    </div>
  );
}

type Allocation = {
  key: string;
  label: string;
  pct: number;
  note: string;
  tone: PillTone;
  detail: string;
};

function pctToBar(pct: number) {
  const clamped = Math.max(0, Math.min(100, pct));
  return `${clamped}%`;
}

export default function TokenomicsPage() {
  // You can swap these later from env or DB without changing layout
  const supply = 50_000_000_000; // 50B minted now (your screenshot)
  const decimals = 6;

  const allocation = useMemo<Allocation[]>(
    () => [
      {
        key: 'daily',
        label: 'Daily rewards pool',
        pct: 40,
        note:
          'Protocol-locked rewards that fund the daily main pot. This is the core primitive.',
        detail:
          'Designed for longevity: dedicated payout vault(s), predictable emission rules, and verifiable distribution. This allocation is reserved for rewards - not ops.',
        tone: 'emerald',
      },
      {
        key: 'liquidity',
        label: 'Liquidity + market ops',
        pct: 20,
        note:
          'LP depth, market resilience, and controlled expansion across venues and pairs.',
        detail:
          'Used to seed and defend liquidity, reduce fragility, and keep price discovery healthy. The goal is stability and trust - not hype.',
        tone: 'sky',
      },
      {
        key: 'treasury',
        label: 'Treasury + runway',
        pct: 18,
        note:
          'Audits, infra, legal, and long-horizon ecosystem investment to survive every cycle.',
        detail:
          'This is the safety buffer that lets XPOT operate like infrastructure. It funds reliability, security, and long-term execution without touching rewards.',
        tone: 'slate',
      },
      {
        key: 'team',
        label: 'Team + builders',
        pct: 10,
        note:
          'Vested, long horizon. Builders stay aligned with holders and protocol health.',
        detail:
          'Credibility comes from structure: a long cliff and slow linear vesting. Builders earn upside by shipping, not by selling into early liquidity.',
        tone: 'amber',
      },
      {
        key: 'partners',
        label: 'Partners + creators',
        pct: 7,
        note:
          'Creator-gated drops, sponsor pools, and strategic distribution with accountability.',
        detail:
          'Reserved for performance-based collaborations: creators, brands, and integrations that measurably grow participation and sponsor demand.',
        tone: 'sky',
      },
      {
        key: 'community',
        label: 'Community incentives',
        pct: 5,
        note:
          'Streak rewards, referral boosts, and reputation-based unlocks that feel earned.',
        detail:
          'Built for delight over farming: targeted incentives for real users and real momentum. Surprise rewards beat extractive grind loops.',
        tone: 'emerald',
      },
    ],
    [],
  );

  const [openKey, setOpenKey] = useState<string | null>('daily');

  return (
    <XpotPageShell
      title="Tokenomics"
      subtitle="XPOT is designed as a reward protocol with compounding network effects, not a one-off game."
      topBarProps={{
        pillText: 'TOKENOMICS',
        sloganRight: 'Protocol-grade distribution',
      }}
    >
      {/* HERO */}
      <section className="mt-6">
        <div className={CARD}>
          {/* Halo */}
          <div
            className="
              pointer-events-none absolute -inset-48 opacity-85 blur-3xl
              bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,0.22),transparent_55%),
                  radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.22),transparent_55%),
                  radial-gradient(circle_at_80%_90%,rgba(245,158,11,0.16),transparent_60%)]
            "
          />

          <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:p-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="emerald">
                  <Sparkles className="h-3.5 w-3.5" />
                  Reward protocol
                </Pill>
                <Pill tone="sky">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Public by handle
                </Pill>
                <Pill tone="amber">
                  <Lock className="h-3.5 w-3.5" />
                  Self-custody
                </Pill>
              </div>

              <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
                A distribution designed to outlast hype.
                <span className="text-emerald-300"> Rewards come first.</span>
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                Traditional lottery and casino models extract value and hide it behind black boxes.
                XPOT flips the equation: rewards are the primitive, identity is public by handle, and
                payouts are verifiable on-chain. Over time, this becomes infrastructure for creators,
                communities, and sponsors to run daily rewards without becoming a casino.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link href={ROUTE_HUB} className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}>
                  Enter today&apos;s XPOT
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href={ROUTE_TERMS} className={`${BTN_UTILITY} px-5 py-2.5 text-sm`}>
                  Terms
                </Link>
                <span className="text-[11px] text-slate-500">
                  Allocation is designed to prioritize rewards, resilience, and long-term execution.
                </span>
              </div>
            </div>

            {/* STATS */}
            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-900/70 bg-slate-950/60 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Current supply
                </p>
                <Money value={supply.toLocaleString()} suffix="XPOT" />
                <p className="mt-2 text-xs text-slate-500">
                  Decimals: <span className="font-mono text-slate-200">{decimals}</span>
                </p>

                {/* Trust / confidence block (img2 upgrade) */}
                <div className="mt-4 rounded-2xl border border-slate-900/70 bg-slate-950/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Supply integrity
                  </p>

                  <div className="mt-3 grid gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Lock className="h-4 w-4 text-emerald-300" />
                      Fixed supply - 50B minted, supply locked
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <ShieldCheck className="h-4 w-4 text-sky-300" />
                      Minting disabled - mint authority revoked
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <BadgeCheck className="h-4 w-4 text-amber-200" />
                      Metadata finalized - verifiable in explorer
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-500">
                    Everything above should be verifiable on-chain via Solscan and SPL tooling.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-900/70 bg-slate-950/60 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Core promise
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Daily rewards that grow into an ecosystem
                </p>
                <div className="mt-3 grid gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                    On-chain payout verification
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Users className="h-4 w-4 text-sky-300" />
                    Public identity by X handle
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Blocks className="h-4 w-4 text-amber-200" />
                    Modules can plug in later
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-900/70 bg-slate-950/60 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  North star
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Become the daily rewards layer for the internet
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Disruption comes from transparency, repeatability, and sponsor-friendly distribution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALLOCATION */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className={CARD}>
          <div
            className="
              pointer-events-none absolute -inset-40 opacity-70 blur-3xl
              bg-[radial-gradient(circle_at_10%_30%,rgba(56,189,248,0.18),transparent_60%),
                  radial-gradient(circle_at_90%_70%,rgba(16,185,129,0.18),transparent_60%)]
            "
          />
          <div className="relative z-10 p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Allocation design
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Built to reward holders first, sustain liquidity, and fund long-term execution.
                </p>
              </div>
              <Pill tone="sky">
                <PieChart className="h-3.5 w-3.5" />
                Distribution
              </Pill>
            </div>

            <div className="mt-6 space-y-3">
              {allocation.map(a => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setOpenKey(k => (k === a.key ? null : a.key))}
                  className="group w-full rounded-2xl border border-slate-900/70 bg-slate-950/55 px-4 py-4 text-left hover:bg-slate-950/70 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Pill tone={a.tone}>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                        {a.pct}%
                      </Pill>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {a.label}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Tap to expand
                        </p>
                      </div>
                    </div>

                    <div className="w-full max-w-[220px]">
                      <div className="h-2 rounded-full bg-slate-900/70">
                        <motion.div
                          className="h-2 rounded-full bg-emerald-400/70"
                          initial={false}
                          animate={{ width: pctToBar(a.pct) }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {openKey === a.key && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 rounded-2xl border border-slate-900/70 bg-slate-950/50 p-4">
                          <p className="text-sm text-slate-200">{a.note}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            {a.detail}
                          </p>
                          <p className="mt-3 text-[11px] text-slate-600">
                            Implementation: dedicated vaults, timelocks, and public wallets so allocations stay auditable.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* UTILITY */}
        <div className="space-y-4">
          <div className={CARD}>
            <div
              className="
                pointer-events-none absolute -inset-44 opacity-75 blur-3xl
                bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_60%),
                    radial-gradient(circle_at_90%_70%,rgba(16,185,129,0.16),transparent_60%)]
              "
            />
            <div className="relative z-10 p-6 lg:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Utility map
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Why hold XPOT when you could just watch?
                  </p>
                </div>
                <Pill tone="emerald">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Flywheel
                </Pill>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Gift className="h-4 w-4 text-emerald-300" />
                    Eligibility
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Holding XPOT is the requirement to claim entry. No purchases, no ticket sales, no casino vibes.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Crown className="h-4 w-4 text-amber-200" />
                    Status and reputation
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Your handle becomes a public identity. Wins, streaks, and participation can build a profile
                    that unlocks future perks and sponsor drops.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Flame className="h-4 w-4 text-sky-300" />
                    Sponsor-funded rewards
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Brands buy XPOT to fund bonus drops. Holders get value, sponsors get measurable attention,
                    and the protocol grows without selling tickets.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    Transparency edge
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Casinos win by opacity. XPOT wins by verifiability. Over time, that becomes a trust moat.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={CARD}>
            <div className="relative z-10 p-6 lg:p-8">
              <p className="text-sm font-semibold text-slate-100">
                Long-term: why this can disrupt
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                The endgame is not “a meme draw”. The endgame is a protocol that communities
                and brands plug into for daily rewards, with identity and transparency baked in.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link href="/roadmap" className={`${BTN_UTILITY} px-5 py-2.5 text-sm`}>
                  View roadmap
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>

                <a
                  href="https://solscan.io"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-5 py-2.5 text-sm text-slate-200 hover:bg-slate-900 transition"
                >
                  Token explorer
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-10 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-slate-400" />
            Tokenomics is premium-first: simple, verifiable, and sponsor-friendly.
          </span>
          <span className="font-mono text-slate-600">build: tokenomics-v2</span>
        </div>
      </footer>
    </XpotPageShell>
  );
}
