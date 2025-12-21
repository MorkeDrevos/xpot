// app/roadmap/page.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  Crown,
  Layers,
  Lock,
  Rocket,
  ShieldCheck,
  Sparkles,
  Stars,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

import XpotPageShell from '@/components/XpotPageShell';

type PillTone = 'slate' | 'emerald' | 'gold' | 'sky';

const BTN_PRIMARY = 'xpot-btn xpot-btn-vault h-11 px-6 text-sm xpot-focus-gold';
const BTN_UTILITY = 'xpot-btn h-11 px-6 text-sm';

function toneDot(tone: PillTone) {
  const map: Record<PillTone, string> = {
    slate: 'bg-slate-400/70',
    emerald: 'bg-emerald-400/80',
    gold: 'bg-[rgba(var(--xpot-gold),0.85)]',
    sky: 'bg-sky-300/80',
  };
  return map[tone];
}

function Pill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: PillTone;
}) {
  const map: Record<PillTone, string> = {
    slate:
      'border-slate-800/70 bg-slate-950/55 text-slate-200 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]',
    emerald:
      'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]',
    gold:
      'xpot-pill-gold border bg-[rgba(var(--xpot-gold),0.10)] text-[rgb(var(--xpot-gold-2))] shadow-[0_0_0_1px_rgba(214,176,79,0.12)]',
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

type Phase = {
  key: string;
  label: string;
  title: string;
  tagline: string;
  tone: PillTone;
  icon: React.ReactNode;
  bullets: string[];
  outcome: string;
};

export default function RoadmapPage() {
  const phases = useMemo<Phase[]>(
    () => [
      {
        key: 'p0',
        label: 'Phase 0 - Foundation',
        title: 'Make the core primitive undeniable',
        tagline: 'Harden the daily draw until it feels inevitable',
        tone: 'emerald',
        icon: <ShieldCheck className="h-4 w-4" />,
        bullets: [
          'Daily draw mechanics hardened and observable',
          'Winner feed and proof UX polished',
          'Handle-first identity narrative everywhere',
          'Basic bonus drops and timers in hub',
          'Security posture, rate limits, and abuse protection',
        ],
        outcome: 'A daily rewards protocol that feels inevitable',
      },
      {
        key: 'p1',
        label: 'Phase 1 - Habit',
        title: 'Make the dashboard addictive in a premium way',
        tagline: 'Turn identity progression into a daily ritual',
        tone: 'sky',
        icon: <Zap className="h-4 w-4" />,
        bullets: [
          'Streaks and attendance rewards (reputation over time)',
          'Personalized hub: your status, your streak, your history',
          'Live entry presence: public handles, private wallets',
          'Better bonus drop UX: claim windows, countdowns, reminders',
          'XPOT profile card per handle (wins, streaks, badges)',
        ],
        outcome: 'Users come back daily because their identity is building',
      },
      {
        key: 'p2',
        label: 'Phase 2 - Sponsors',
        title: 'Bring real budgets on-chain without casino vibes',
        tagline: 'Brands fund pools because performance is provable',
        tone: 'gold',
        icon: <Crown className="h-4 w-4" />,
        bullets: [
          'Sponsor-funded bonus pools (brands buy XPOT to fund drops)',
          'Creator-gated pools and community pools',
          'Public sponsor scoreboard and verified funding proofs',
          'Partner tooling: campaign setup, targeting, reporting',
          'Compliance-first messaging and clear terms surfaces',
        ],
        outcome: 'XPOT becomes sponsor-friendly distribution infrastructure',
      },
      {
        key: 'p3',
        label: 'Phase 3 - Ecosystem modules',
        title: 'Plug-in rewards for other products and communities',
        tagline: 'Make draws a reusable primitive other apps can embed',
        tone: 'slate',
        icon: <Layers className="h-4 w-4" />,
        bullets: [
          'Reusable selection primitive (draws as a service)',
          'Multiple reward formats: daily, weekly, seasonal',
          'Optional tiers: VIP lanes, club pools, creator seasons',
          'API and SDK for partners to embed XPOT draws',
          'Better anti-bot gravity without KYC vibes',
        ],
        outcome: 'XPOT becomes the default rewards layer for communities',
      },
      {
        key: 'p4',
        label: 'Phase 4 - Disruption',
        title: 'Compete with legacy lottery and casino networks',
        tagline: 'Win by compounding trust, not by hiding the math',
        tone: 'emerald',
        icon: <Rocket className="h-4 w-4" />,
        bullets: [
          'Mass distribution through creators and brands',
          'Transparent prize pools that anyone can audit',
          'Global participation with public identity',
          'Real-world sponsor prizes layered on top (optional)',
          'Reputation-based safeguards and responsible design',
        ],
        outcome: 'A credible alternative to legacy “trust us” systems',
      },
    ],
    [],
  );

  const [openKey, setOpenKey] = useState<string>('p1');

  return (
    <XpotPageShell
      title="Roadmap"
      subtitle="Long-term plan: build a daily rewards ecosystem that becomes infrastructure."
      topBarProps={{
        pillText: 'ROADMAP',
        sloganRight: 'Disrupt by compounding trust',
      }}
      pageTag="hub"
    >
      {/* HERO */}
      <section className="mt-6">
        <div className="xpot-panel">
          <div
            className="pointer-events-none absolute -inset-64 opacity-85 blur-3xl"
            style={{
              background:
                'radial-gradient(circle at 12% 18%, rgba(56,189,248,0.20), transparent 55%),' +
                'radial-gradient(circle at 55% 18%, rgba(99,102,241,0.16), transparent 60%),' +
                'radial-gradient(circle at 88% 22%, rgba(236,72,153,0.18), transparent 62%),' +
                'radial-gradient(circle at 70% 92%, rgba(214,176,79,0.06), transparent 60%)',
            }}
          />
          <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:p-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="sky">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Long-term plan
                </Pill>
                <Pill tone="emerald">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Trust moat
                </Pill>
                <Pill tone="gold">
                  <Lock className="h-3.5 w-3.5" />
                  No casino vibes
                </Pill>
              </div>

              <h1 className="text-balance text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
                Build the daily rewards layer for the internet.
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                The roadmap is designed around one strategy: compounding trust. Legacy operators win because
                people accept opaque systems. XPOT wins by making reward pools verifiable, sponsor-friendly,
                and identity-driven. Nail habit, then sponsors, then modules and the ecosystem becomes bigger
                than a single app.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/tokenomics" className={BTN_UTILITY}>
                  Tokenomics
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/hub" className={BTN_PRIMARY}>
                  Open Holder Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <div className="pt-2">
                <div className="xpot-divider" />
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Stars className="h-4 w-4 text-slate-500" />
                    One protocol. One identity. One daily draw.
                  </span>
                  <span className="text-slate-700">•</span>
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-slate-500" />
                    Ship in slices, keep it stable
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT HERO STACK */}
            <div className="grid gap-3">
              <div className="xpot-card px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Guiding principles</p>
                <div className="mt-3 grid gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                    Verifiable payouts, public proof
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Users className="h-4 w-4 text-sky-300" />
                    Identity by handle, not wallets
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Trophy className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                    Reputation over addiction loops
                  </div>
                </div>
              </div>

              <div className="xpot-card px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Long-term vision</p>
                <p className="mt-2 text-sm text-slate-200">
                  A daily protocol that creators and brands fund because it performs.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  If sponsors can buy XPOT and directly fund pools, XPOT becomes infrastructure.
                </p>
              </div>

              <div className="xpot-card px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Narrative</p>
                  <Pill tone="emerald">
                    <Stars className="h-3.5 w-3.5" />
                    XPOT style
                  </Pill>
                </div>
                <p className="mt-2 text-sm text-slate-200">One protocol. One identity. One daily draw.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHASES */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT: PHASE LIST */}
        <div className="xpot-panel">
          <div
            className="pointer-events-none absolute -inset-56 opacity-70 blur-3xl"
            style={{
              background:
                'radial-gradient(circle at 15% 30%, rgba(16,185,129,0.14), transparent 60%),' +
                'radial-gradient(circle at 92% 70%, rgba(56,189,248,0.14), transparent 60%),' +
                'radial-gradient(circle at 70% 18%, rgba(236,72,153,0.10), transparent 62%)',
            }}
          />
          <div className="relative z-10 p-6 lg:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Phases</p>
                <p className="mt-1 text-xs text-slate-400">Click a phase to expand details.</p>
              </div>
              <Pill tone="sky">
                <Rocket className="h-3.5 w-3.5" />
                Strategy
              </Pill>
            </div>

            <div className="mt-6 space-y-3">
              {phases.map(p => {
                const isOpen = openKey === p.key;

                return (
                  <div key={p.key} className="xpot-card p-0">
                    <button
                      type="button"
                      onClick={() => setOpenKey(k => (k === p.key ? '' : p.key))}
                      className="group w-full rounded-[18px] px-4 py-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill tone={p.tone}>
                              {p.icon}
                              {p.label}
                            </Pill>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                              Tap to expand
                            </span>
                          </div>

                          <p className="mt-3 text-base font-semibold leading-snug text-slate-100">
                            {p.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{p.tagline}</p>

                          <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                            <p className="text-xs text-slate-400">
                              Outcome:{' '}
                              <span className="text-slate-200">{p.outcome}</span>
                            </p>
                          </div>
                        </div>

                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.18 }}
                          className="mt-1 shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-300"
                          aria-hidden
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4">
                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                              <ul className="grid gap-2">
                                {p.bullets.map((b, idx) => (
                                  <li key={idx} className="flex gap-2 text-sm text-slate-300">
                                    <span className={['mt-2 h-1.5 w-1.5 rounded-full', toneDot(p.tone)].join(' ')} />
                                    <span className="min-w-0">{b}</span>
                                  </li>
                                ))}
                              </ul>

                              <div className="mt-4 text-xs text-slate-500">
                                Notes: ship in slices, not big bangs, so the protocol stays stable.
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: ECOSYSTEM MAP */}
        <div className="space-y-4">
          <div className="xpot-panel">
            <div className="relative z-10 p-6 lg:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Ecosystem building blocks</p>
                  <p className="mt-1 text-xs text-slate-400">
                    What we can build that legacy operators cannot copy easily.
                  </p>
                </div>
                <Pill tone="emerald">
                  <Sparkles className="h-3.5 w-3.5" />
                  Moat
                </Pill>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="xpot-card px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Users className="h-4 w-4 text-sky-300" />
                    Identity graph
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Handles become a public layer. Streaks, wins, badges create reputation.
                  </p>
                </div>

                <div className="xpot-card px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    Proof UX
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Winners can verify payouts and share proof publicly. Trust compounds.
                  </p>
                </div>

                <div className="xpot-card px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Crown className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                    Sponsor rails
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Sponsors fund pools by buying XPOT. No ticket sales needed.
                  </p>
                </div>

                <div className="xpot-card px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Trophy className="h-4 w-4 text-emerald-300" />
                    Module marketplace
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Plug-in reward formats for communities and partners, all using the same primitive.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Sparkles className="h-4 w-4 text-slate-300" />
                  The disruption thesis
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Casinos and lotteries scale by central trust and hidden math. XPOT scales by transparent
                  distribution and public identity. When creators and sponsors can run daily rewards with
                  verifiable pools, the old model starts to look outdated.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link href="/tokenomics" className={BTN_UTILITY}>
                    Read tokenomics
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link href="/hub" className={BTN_PRIMARY}>
                    Go to hub
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="xpot-panel">
            <div className="relative z-10 p-6 lg:p-8">
              <p className="text-sm font-semibold text-slate-100">What ships first</p>
              <p className="mt-2 text-sm text-slate-300">
                Habit is the multiplier. The hub becomes a premium daily ritual with clear timers, main pot,
                bonus pot and identity progression.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Pill tone="emerald">
                  <Zap className="h-3.5 w-3.5" />
                  Streaks
                </Pill>
                <Pill tone="sky">
                  <Users className="h-3.5 w-3.5" />
                  Profiles
                </Pill>
                <Pill tone="gold">
                  <Crown className="h-3.5 w-3.5" />
                  Sponsors
                </Pill>
                <Pill tone="slate">
                  <Layers className="h-3.5 w-3.5" />
                  Modules
                </Pill>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-10 pb-10">
        <div className="xpot-divider" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-slate-400" />
            Roadmap is direction. Execution ships in slices.
          </span>
          <span className="font-mono text-slate-600">build: roadmap-xpot</span>
        </div>
      </footer>
    </XpotPageShell>
  );
}
