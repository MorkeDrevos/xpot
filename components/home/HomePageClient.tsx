// components/home/HomePageClient.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Crown,
  ExternalLink,
  Globe,
  Radio,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';
import XpotFooter from '@/components/XpotFooter';
import FinalDrawDate from '@/components/FinalDrawDate';

import { RUN_DAYS, RUN_END_EU } from '@/lib/xpotRun';

import NextDrawProvider, { useNextDraw } from './NextDrawProvider';
import { calcRunProgress, runTitle } from './madrid';
import { useBonusActive } from './hooks/useBonusActive';
import { useLatestWinner } from './hooks/useLatestWinner';

import MissionBanner from './hero/MissionBanner';
import CosmicHeroBackdrop from './hero/CosmicHeroBackdrop';
import BonusVault from './hero/BonusVault';
import LiveControlRoom from './hero/LiveControlRoom';

import {
  Accordion,
  GOLD_BG_WASH,
  GOLD_BORDER_SOFT,
  GOLD_TEXT,
  GOLD_TEXT_DIM,
  MiniStat,
  Pill,
  PremiumCard,
  shortenAddress,
} from './ui';

const ROUTE_HUB = '/hub';
const ROUTE_TOKENOMICS_RESERVE = '/tokenomics?tab=rewards&focus=reserve';

const XPOT_CA =
  process.env.NEXT_PUBLIC_XPOT_MINT ||
  process.env.NEXT_PUBLIC_XPOT_CA ||
  'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1';

const XPOT_JUP_SWAP_URL =
  process.env.NEXT_PUBLIC_XPOT_JUP_SWAP_URL ||
  `https://jup.ag/?sell=So11111111111111111111111111111111111111112&buy=${XPOT_CA}`;

const XPOT_DEXSCREENER_URL =
  process.env.NEXT_PUBLIC_XPOT_DEXSCREENER_URL || `https://dexscreener.com/solana/${XPOT_CA}`;

const XPOT_SOLSCAN_URL =
  process.env.NEXT_PUBLIC_XPOT_SOLSCAN_URL || `https://solscan.io/token/${XPOT_CA}`;

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.45)] hover:bg-emerald-300 transition';

function setMeta(name: string, content: string) {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function RoyalContractBar({ mint }: { mint: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className={`
          relative inline-flex items-center gap-3
          rounded-full border ${GOLD_BORDER_SOFT} bg-slate-950/55
          px-3.5 py-2
          shadow-[0_22px_90px_rgba(var(--xpot-gold),0.12)]
          backdrop-blur-md
        `}
        title={mint}
      >
        <div
          className="
            pointer-events-none absolute -inset-10 rounded-full opacity-70 blur-2xl
            bg-[radial-gradient(circle_at_18%_30%,rgba(var(--xpot-gold),0.22),transparent_60%),
                radial-gradient(circle_at_85%_35%,rgba(255,255,255,0.06),transparent_62%)]
          "
        />

        <span className="relative z-10 inline-flex items-center gap-2">
          <span
            className={`
              inline-flex h-7 w-7 items-center justify-center rounded-full
              border ${GOLD_BORDER_SOFT} ${GOLD_BG_WASH}
              shadow-[0_0_22px_rgba(var(--xpot-gold),0.22)]
            `}
          >
            <ShieldCheck className={`h-4 w-4 ${GOLD_TEXT}`} />
          </span>

          <span className="flex flex-col leading-tight">
            <span className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${GOLD_TEXT_DIM}`}>
              Official contract
            </span>

            <span className="font-mono text-[12px] text-slate-100/90">{shortenAddress(mint, 6, 6)}</span>
          </span>
        </span>

        <span className="relative z-10 h-6 w-px bg-white/10" />

        <button
          type="button"
          onClick={onCopy}
          className="
            relative z-10 inline-flex items-center gap-2
            rounded-full border border-white/10 bg-white/[0.03]
            px-3 py-1.5 text-[11px] text-slate-200
            hover:bg-white/[0.06] transition
          "
          title="Copy official contract address"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function TradeOnJupiterCard({ mint }: { mint: string }) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -inset-28 opacity-80 blur-3xl bg-[radial-gradient(circle_at_16%_20%,rgba(56,189,248,0.14),transparent_62%),radial-gradient(circle_at_85%_25%,rgba(16,185,129,0.12),transparent_62%),radial-gradient(circle_at_50%_0%,rgba(var(--xpot-gold),0.14),transparent_62%)]" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">Trade</p>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
            Primary venue is Jupiter. Always verify the mint and use official links.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={XPOT_JUP_SWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                BTN_GREEN,
                'group px-5 py-2.5 text-[13px]',
                'shadow-[0_18px_70px_rgba(16,185,129,0.25)]',
              ].join(' ')}
              title="Trade XPOT on Jupiter"
            >
              Trade on Jupiter
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>

            <a
              href={XPOT_DEXSCREENER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] text-slate-200 hover:bg-white/[0.06] transition"
              title="View chart"
            >
              <TrendingUp className="h-4 w-4 text-slate-300" />
              View chart
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </a>

            <a
              href={XPOT_SOLSCAN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] text-slate-200 hover:bg-white/[0.06] transition"
              title="View on Solscan"
            >
              <ShieldCheck className="h-4 w-4 text-slate-300" />
              Explorer
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </a>
          </div>

          <p className="mt-3 font-mono text-[11px] text-slate-500">mint: {shortenAddress(mint, 8, 8)}</p>
        </div>
      </div>
    </div>
  );
}

function HomeInner() {
  const bonusActive = useBonusActive();
  const latestWinner = useLatestWinner(); // ready when you flip SHOW_LIVE_FEED

  const SHOW_LIVE_FEED = false;

  const { countdown, cutoffLabel, nowMs } = useNextDraw();
  const run = useMemo(() => calcRunProgress(new Date(nowMs)), [nowMs]);
  const runLine = useMemo(() => `DAY ${run.day}/${RUN_DAYS}`, [run.day]);

  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  const floatY = useTransform(scrollY, [0, 900], [0, -18]);
  const floatYSpring = useSpring(floatY, { stiffness: 80, damping: 22, mass: 0.6 });

  const tilt = useTransform(scrollY, [0, 900], [0, -0.25]);
  const tiltSpring = useSpring(tilt, { stiffness: 70, damping: 20, mass: 0.6 });

  const depth = useTransform(scrollY, [0, 900], [0, 1]);
  const depthShadow = useTransform(depth, v => {
    const a = 0.55 + v * 0.06;
    const b = 0.22 + v * 0.06;
    return `0 40px 140px rgba(0,0,0,${a}), 0 14px 60px rgba(0,0,0,${b})`;
  });

  useEffect(() => {
    document.title = runTitle(run.day, run.started, run.ended, cutoffLabel);
    setMeta(
      'description',
      `XPOT is a daily draw protocol with handle-first identity and on-chain proof. Final draw: ${RUN_END_EU}.`,
    );
  }, [run.day, run.started, run.ended, cutoffLabel]);

  const faq = useMemo(
    () => [
      {
        q: 'What is “The Final Draw” exactly?',
        a: `It’s the finale of a 7000-day global XPOT run. Daily entries happen through the hub and the run ends at ${RUN_END_EU}.`,
      },
      {
        q: 'Do I need tickets to enter?',
        a: 'No tickets. Eligibility is holdings-based. Hold XPOT, verify eligibility in the hub and claim your entry.',
      },
      {
        q: 'Why do winners show as @handle?',
        a: 'XPOT is handle-first: winners and history are presented by X handle for a clean public layer while claims remain self-custody and wallet-native.',
      },
      {
        q: 'How can anyone verify outcomes?',
        a: 'Outcomes are on-chain. Proof is the product. Anyone can verify distributions in an explorer.',
      },
    ],
    [],
  );

  const hero = (
    <section className="relative">
      <div aria-hidden className="h-[calc(var(--xpot-banner-h,56px)+var(--xpot-topbar-h,112px)+14px)]" />
      <MissionBanner reservesHref={ROUTE_TOKENOMICS_RESERVE} />

      <div className="relative overflow-hidden border-y border-slate-900/60 bg-slate-950/20 shadow-[0_60px_220px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.06),rgba(0,0,0,0.60))]" />

        <div className="relative z-10 w-full px-0">
          <div className="py-5 sm:py-7">
            <div className="relative w-full overflow-hidden rounded-[38px] border border-slate-900/70 bg-slate-950/35 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <CosmicHeroBackdrop />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.45),rgba(255,255,255,0.08),rgba(56,189,248,0.25),transparent)]" />

              <div
                className="
                  relative z-10
                  grid gap-6 p-4 sm:p-6 lg:p-8
                  lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.48fr)]
                "
              >
                {/* LEFT */}
                <div className="flex flex-col justify-between gap-6 lg:pt-8">
                  <div className="space-y-6">
                    <div className="relative p-2 sm:p-3">
                      <div className="relative mt-4">
                        <h1 className="text-5xl font-semibold tracking-tight text-white">
                          One protocol.
                          <br />
                          One daily <span className="xpot-xpotword">XPOT</span> draw.
                        </h1>

                        <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-slate-400">
                          Daily draws are the heartbeat. <span className="text-slate-200">Final Draw</span> is the ending
                          - <FinalDrawDate className="text-slate-200" />.
                        </p>
                      </div>

                      {/* MOBILE: jackpot right after H1 */}
                      <div className="mt-4 grid gap-4 lg:hidden">
                        <PremiumCard className="p-4" halo sheen>
                          <div className="xpot-console-sweep" aria-hidden />
                          <div className="relative z-10">
                            <JackpotPanel variant="standalone" layout="wide" />
                          </div>
                        </PremiumCard>
                      </div>

                      <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 ring-1 ring-white/[0.05]">
                        <div className="relative flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                              Next draw
                            </p>

                            <p className="mt-1 flex items-baseline gap-2 text-[12px] text-slate-400">
                              <span className="text-slate-500">In</span>
                              <span className="font-semibold tabular-nums text-slate-100">{countdown}</span>
                              <span className="text-[11px] text-slate-500">Madrid 22:00</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {bonusActive ? (
                        <div className="mt-5">
                          <BonusVault>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200 shadow-[0_0_0_1px_rgba(139,92,246,0.18)]">
                                <span className="relative flex h-2 w-2">
                                  <span className="absolute inset-0 rounded-full bg-violet-400/60 animate-ping" />
                                  <span className="relative h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_14px_rgba(167,139,250,0.9)]" />
                                </span>
                                Bonus XPOT active
                              </span>

                              <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-100 ring-1 ring-violet-400/20">
                                Same entry
                                <span className="h-1 w-1 rounded-full bg-white/20" />
                                Paid on-chain
                              </span>
                            </div>

                            <BonusStrip variant="home" />

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <p className="text-[12px] text-slate-300">
                                Bonus window is live - same entry, extra payout, proof on-chain.
                              </p>

                              <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200 ring-1 ring-violet-400/20">
                                <Sparkles className="h-3.5 w-3.5" />
                                Vault reveal
                              </span>
                            </div>
                          </BonusVault>
                        </div>
                      ) : null}

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3.5 text-sm`} title="Enter the hub">
                          Enter the hub
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>

                      {SHOW_LIVE_FEED && latestWinner ? (
                        <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/30 p-5 ring-1 ring-white/[0.05]">
                          <div className="flex items-center justify-between gap-3">
                            <Pill tone="amber">
                              <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
                              Latest winner
                            </Pill>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">live</span>
                          </div>
                          <div className="mt-3 text-sm text-slate-200">
                            {latestWinner.handle ? latestWinner.handle : latestWinner.wallet ? shortenAddress(latestWinner.wallet, 6, 6) : 'winner'}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-4">
                      <PremiumCard className="p-5 sm:p-6" halo={false}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">Contract</p>
                            <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
                              Always verify the official mint before interacting.
                            </p>
                          </div>
                          <RoyalContractBar mint={XPOT_CA} />
                        </div>
                      </PremiumCard>

                      <PremiumCard className="p-5 sm:p-6" halo={false}>
                        <TradeOnJupiterCard mint={XPOT_CA} />
                      </PremiumCard>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Run day" value={`#${run.day}/${RUN_DAYS}`} tone="amber" />
                    <MiniStat label="Next cutoff" value={countdown} tone="emerald" />
                    <MiniStat label="Final draw" value={<FinalDrawDate variant="short" />} tone="violet" />
                  </div>
                </div>

                {/* RIGHT (desktop only) */}
                <motion.div
                  className="hidden gap-4 lg:grid"
                  style={
                    reduceMotion
                      ? undefined
                      : {
                          y: floatYSpring as any,
                          rotateZ: tiltSpring as any,
                          transformOrigin: '50% 10%',
                        }
                  }
                >
                  <motion.div style={reduceMotion ? undefined : { boxShadow: depthShadow as any }}>
                    <PremiumCard className="p-5 sm:p-6" halo sheen>
                      <div className="xpot-console-sweep" aria-hidden />
                      <div className="relative z-10">
                        <JackpotPanel variant="standalone" layout="wide" />
                      </div>
                    </PremiumCard>
                  </motion.div>

                  <PremiumCard className="p-5 sm:p-6" halo={false}>
                    <LiveControlRoom countdown={countdown} cutoffLabel={cutoffLabel} runLine={runLine} />
                  </PremiumCard>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <XpotPageShell pageTag="home" fullBleedTop={hero}>
      {/* HOW IT WORKS */}
      <section className="mt-7">
        <PremiumCard className="p-6 sm:p-8" halo sheen>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <Pill tone="amber">
                <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
                The Final Draw
              </Pill>

              <h2 className="mt-3 text-balance text-2xl font-semibold text-slate-50 sm:text-3xl">
                Daily draws with proof. One run ending with a finale.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                XPOT is simple on purpose: holdings-based eligibility, handle-first identity and on-chain payout proof.
                Daily draws are the heartbeat. The Final Draw is the destination.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="emerald">
                <ShieldCheck className="h-3.5 w-3.5" />
                Proof first
              </Pill>
              <Pill tone="sky">
                <Users className="h-3.5 w-3.5" />
                X identity
              </Pill>
              <Pill tone="violet">
                <Timer className="h-3.5 w-3.5" />
                Daily cadence
              </Pill>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-slate-900/70 bg-slate-950/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <p className="text-sm text-slate-300">
                Built for serious players: clean rules, public arc and provable outcomes.
              </p>
            </div>

            <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-5 py-2.5 text-sm`}>
              Claim your entry
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </PremiumCard>
      </section>

      {/* PROTOCOL STRIP */}
      <section className="mt-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="amber">
              <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
              Finale (ending)
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">The Final Draw is the ending.</p>
            <p className="mt-2 text-sm text-slate-300">Daily draws build the arc. The finale builds the legend.</p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="sky">
              <Users className="h-3.5 w-3.5" />
              Identity
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">@handle-first.</p>
            <p className="mt-2 text-sm text-slate-300">Winners and history are shown by handle, not wallet profiles.</p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="emerald">
              <ShieldCheck className="h-3.5 w-3.5" />
              Proof
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">Paid on-chain in XPOT.</p>
            <p className="mt-2 text-sm text-slate-300">Anyone can verify outcomes in an explorer.</p>
          </PremiumCard>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className="mt-8">
        <PremiumCard className="p-6 sm:p-8" halo sheen>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <Pill tone="violet">
                <Blocks className="h-3.5 w-3.5" />
                Built to scale
              </Pill>

              <h2 className="mt-3 text-balance text-2xl font-semibold text-slate-50 sm:text-3xl">
                A daily engine with an ending, not a one-off giveaway.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                XPOT stays minimal where it matters and expandable where it counts. The system can grow with modules and
                sponsor pools while keeping the same primitive and the same proof.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="emerald">
                <ShieldCheck className="h-3.5 w-3.5" />
                Fair by design
              </Pill>
              <Pill tone="sky">
                <Globe className="h-3.5 w-3.5" />
                Global-friendly
              </Pill>
              <Pill tone="amber">
                <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
                Finale-ready
              </Pill>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-950/30">
                  <Wand2 className="h-5 w-5 text-emerald-200" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">Modules</p>
                  <p className="text-xs text-slate-400">Plug-in reward logic</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>Streak boosters</li>
                <li>Sponsor-funded pools</li>
                <li>Milestone ladders</li>
              </ul>
            </div>

            <div className="rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-500/25 bg-sky-950/25">
                  <Users className="h-5 w-5 text-sky-200" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">Identity</p>
                  <p className="text-xs text-slate-400">Handle-first, premium UX</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>Winners shown by @handle</li>
                <li>History can evolve into reputation</li>
                <li>Still self-custody for claims</li>
              </ul>
            </div>

            <div className="rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-5">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${GOLD_BORDER_SOFT} ${GOLD_BG_WASH}`}>
                  <Crown className={`h-5 w-5 ${GOLD_TEXT}`} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">Finale</p>
                  <p className="text-xs text-slate-400">A run that ends</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>Final draw: <FinalDrawDate variant="short" /></li>
                <li>Daily cadence builds the arc</li>
                <li>Proof stays public</li>
              </ul>
            </div>
          </div>
        </PremiumCard>
      </section>

      {/* FAQ */}
      <section className="mt-8">
        <PremiumCard className="p-6 sm:p-8" halo={false}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <Pill tone="emerald">
                <ShieldCheck className="h-3.5 w-3.5" />
                Clarity
              </Pill>
              <h2 className="mt-3 text-balance text-2xl font-semibold text-slate-50 sm:text-3xl">FAQ</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Homepage is the story. Hub is the action. The Final Draw is the destination.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Accordion items={faq} />
          </div>
        </PremiumCard>
      </section>

      <XpotFooter />
    </XpotPageShell>
  );
}

export default function HomePageClient() {
  return (
    <NextDrawProvider>
      <HomeInner />
    </NextDrawProvider>
  );
}
