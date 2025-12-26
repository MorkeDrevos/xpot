// app/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode, createContext, useContext } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  ChevronDown,
  Copy,
  Crown,
  ExternalLink,
  Globe,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  Timer,
  Radio,
  Check,
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';
import XpotFooter from '@/components/XpotFooter';
import FinalDrawDate from '@/components/FinalDrawDate';

import { RUN_DAYS, RUN_START, RUN_END, RUN_START_EU, RUN_END_EU } from '@/lib/xpotRun';
import { createPortal } from 'react-dom';

const ROUTE_HUB = '/hub';
const ROUTE_TERMS = '/terms';
const ROUTE_TOKENOMICS_RESERVE = '/tokenomics?tab=rewards&focus=reserve';

const XPOT_CA =
  process.env.NEXT_PUBLIC_XPOT_MINT ||
  process.env.NEXT_PUBLIC_XPOT_CA ||
  'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1';

const XPOT_SIGN = '✕';
const MIN_ELIGIBLE_XPOT = 100_000;

// Vault-gold helpers
const GOLD_TEXT = 'text-[rgb(var(--xpot-gold-2))]';
const GOLD_TEXT_DIM = 'text-[rgba(var(--xpot-gold-2),0.85)]';
const GOLD_BORDER_SOFT = 'border-[rgba(var(--xpot-gold),0.25)]';
const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
const GOLD_RING_SHADOW = 'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]';
const GOLD_GLOW_SHADOW = 'shadow-[0_0_10px_rgba(var(--xpot-gold),0.85)]';

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.45)] hover:bg-emerald-300 transition';
const BTN_GHOST =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 font-semibold hover:bg-white/[0.06] transition';

type NextDrawState = {
  nowMs: number;
  nextDrawUtcMs: number;
  countdown: string;
  cutoffLabel: string; // "Madrid 22:00"
};

const NextDrawContext = createContext<NextDrawState | null>(null);

function useNextDraw() {
  const ctx = useContext(NextDrawContext);
  if (!ctx) throw new Error('useNextDraw must be used within NextDrawProvider');
  return ctx;
}

function NextDrawProvider({ children }: { children: ReactNode }) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let interval: number | null = null;

    const start = () => {
      interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    };

    const msToNextSecond = 1000 - (Date.now() % 1000);
    const t = window.setTimeout(() => {
      setNowMs(Date.now());
      start();
    }, msToNextSecond);

    return () => {
      window.clearTimeout(t);
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const nextDrawUtcMs = useMemo(() => getNextMadridCutoffUtcMs(22, new Date(nowMs)), [nowMs]);
  const countdown = useMemo(() => formatCountdown(nextDrawUtcMs - nowMs), [nextDrawUtcMs, nowMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('xpot:next-draw', {
        detail: { nowMs, nextDrawUtcMs, countdown, cutoffLabel: 'Madrid 22:00' },
      }),
    );
  }, [nowMs, nextDrawUtcMs, countdown]);

  const value = useMemo<NextDrawState>(
    () => ({ nowMs, nextDrawUtcMs, countdown, cutoffLabel: 'Madrid 22:00' }),
    [nowMs, nextDrawUtcMs, countdown],
  );

  return <NextDrawContext.Provider value={value}>{children}</NextDrawContext.Provider>;
}

function Pill({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'sky' | 'violet';
}) {
  const map: Record<string, string> = {
    slate: 'border-white/10 bg-white/[0.03] text-slate-200',
    emerald: 'border-emerald-400/18 bg-emerald-500/10 text-emerald-200',
    amber: `${GOLD_BORDER_SOFT} ${GOLD_BG_WASH} ${GOLD_TEXT} ${GOLD_RING_SHADOW}`,
    sky: 'border-sky-400/18 bg-sky-500/10 text-sky-200',
    violet: 'border-violet-400/18 bg-violet-500/10 text-violet-200',
  };

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 leading-none',
        'text-[10px] font-semibold uppercase tracking-[0.18em]',
        map[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="grid gap-3">
      {items.map((it, idx) => {
        const isOpen = open === idx;

        return (
          <div key={it.q} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setOpen(v => (v === idx ? null : idx))}
              className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-slate-100">{it.q}</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-sm leading-relaxed text-slate-300">{it.a}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function shortenAddress(addr: string, left = 6, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

function RoyalContractChip({ mint }: { mint: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <div
      className={[
        'inline-flex items-center gap-2 rounded-full border',
        'border-white/10 bg-white/[0.03] px-3 py-2',
        'backdrop-blur',
      ].join(' ')}
      title={mint}
    >
      <span className="inline-flex items-center gap-2">
        <ShieldCheck className={`h-4 w-4 ${GOLD_TEXT}`} />
        <span className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${GOLD_TEXT_DIM}`}>
          Official contract
        </span>
        <span className="font-mono text-[12px] text-slate-200">{shortenAddress(mint, 6, 6)}</span>
      </span>

      <span className="h-5 w-px bg-white/10" />

      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-200 hover:bg-white/[0.06] transition"
        title="Copy official contract address"
      >
        {copied ? (
          <>
            <Check className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 text-slate-300" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}

/* Bonus visibility */
function useBonusActive() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let alive = true;

    async function probe() {
      try {
        const r = await fetch('/api/bonus/upcoming', { cache: 'no-store' });
        if (!alive) return;

        if (!r.ok) {
          setActive(false);
          return;
        }

        const data = (await r.json().catch(() => null)) as any;
        setActive(Boolean(data?.bonus?.scheduledAt));
      } catch {
        if (!alive) return;
        setActive(false);
      }
    }

    probe();
    const t = window.setInterval(probe, 15_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  return active;
}

/* Madrid cutoff helpers */
function getMadridParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: string, fallback = '0') => Number(parts.find(p => p.type === type)?.value ?? fallback);

  return {
    y: get('year', '0'),
    m: get('month', '1'),
    d: get('day', '1'),
    hh: get('hour', '0'),
    mm: get('minute', '0'),
    ss: get('second', '0'),
  };
}

function getMadridOffsetMs(now = new Date()) {
  const p = getMadridParts(now);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return asUtc - now.getTime();
}

function getMadridUtcMsFromWallClock(
  yy: number,
  mm: number,
  dd: number,
  hh: number,
  mi: number,
  ss: number,
  now = new Date(),
) {
  const offsetMs = getMadridOffsetMs(now);
  const asUtc = Date.UTC(yy, mm - 1, dd, hh, mi, ss);
  return asUtc - offsetMs;
}

function ymdToSerialUtc(yy: number, mm: number, dd: number) {
  return Math.floor(Date.UTC(yy, mm - 1, dd) / 86_400_000);
}

function addYmdDays(yy: number, mm: number, dd: number, days: number) {
  const base = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
  base.setUTCDate(base.getUTCDate() + days);
  return { y: base.getUTCFullYear(), m: base.getUTCMonth() + 1, d: base.getUTCDate() };
}

function calcRunProgress(now = new Date()) {
  const p = getMadridParts(now);

  const runStartCutoffUtc = getMadridUtcMsFromWallClock(RUN_START.y, RUN_START.m, RUN_START.d, RUN_START.hh, RUN_START.mm, 0, now);
  const runEndCutoffUtc = getMadridUtcMsFromWallClock(RUN_END.y, RUN_END.m, RUN_END.d, RUN_END.hh, RUN_END.mm, 0, now);

  const todayCutoffUtc = getMadridUtcMsFromWallClock(p.y, p.m, p.d, 22, 0, 0, now);
  const anchorYmd = now.getTime() >= todayCutoffUtc ? { y: p.y, m: p.m, d: p.d } : addYmdDays(p.y, p.m, p.d, -1);

  const started = now.getTime() >= runStartCutoffUtc;

  let day = 0;
  if (started) {
    const diffDays =
      ymdToSerialUtc(anchorYmd.y, anchorYmd.m, anchorYmd.d) - ymdToSerialUtc(RUN_START.y, RUN_START.m, RUN_START.d);
    day = Math.max(1, diffDays + 1);
  }

  day = Math.max(0, Math.min(RUN_DAYS, day));
  const daysRemaining = Math.max(0, RUN_DAYS - day);
  const ended = now.getTime() >= runEndCutoffUtc;

  return { day, daysRemaining, started, ended };
}

function getNextMadridCutoffUtcMs(cutoffHour = 22, now = new Date()) {
  const p = getMadridParts(now);

  let targetUtc = getMadridUtcMsFromWallClock(p.y, p.m, p.d, cutoffHour, 0, 0, now);
  if (now.getTime() >= targetUtc) {
    const next = addYmdDays(p.y, p.m, p.d, 1);
    targetUtc = getMadridUtcMsFromWallClock(next.y, next.m, next.d, cutoffHour, 0, 0, now);
  }

  return targetUtc;
}

function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

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

/* Mission (light, not another box, no persistence so refresh shows it again) */
function MissionBanner() {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">Mission</p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
          XPOT is building the biggest daily game on the planet - handle-first, proof on-chain and the story is public.
          <span className="text-slate-500"> </span>
          <span className="text-slate-200">If you’re here early you’re not joining later - you’re writing the origin.</span>
          <span className="block mt-1 text-slate-400">
            Step in now and lock your name into the run before the world arrives.
          </span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link href={ROUTE_HUB} className={`${BTN_GREEN} px-4 py-2 text-[12px]`}>
          Enter the hub <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="text-[12px] font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function HomePageInner() {
  const bonusActive = useBonusActive();
  const reduceMotion = useReducedMotion();

  const { countdown, cutoffLabel, nowMs } = useNextDraw();
  const run = useMemo(() => calcRunProgress(new Date(nowMs)), [nowMs]);

  const [mint, setMint] = useState(XPOT_CA);
  useEffect(() => setMint(XPOT_CA), []);

  useEffect(() => {
    const t = run.ended
      ? `XPOT - Final Draw live (${RUN_END_EU})`
      : run.started
      ? `XPOT - Day ${run.day}/${RUN_DAYS} (Next draw ${cutoffLabel})`
      : `XPOT - Run starts ${RUN_START_EU}`;

    document.title = t;
    setMeta('description', `XPOT is a daily draw protocol with handle-first identity and on-chain proof. Final draw: ${RUN_END_EU}.`);
  }, [run.day, run.started, run.ended, cutoffLabel]);

  const faq = useMemo(
    () => [
      {
        q: 'What is the Final Draw?',
        a: `The finale of a 7000-day XPOT run. Daily entries happen through the hub and the run ends at ${RUN_END_EU}.`,
      },
      {
        q: 'Do I need tickets?',
        a: 'No tickets. Eligibility is holdings-based. Hold XPOT, verify in the hub and claim your entry.',
      },
      {
        q: 'Why are winners shown as @handle?',
        a: 'XPOT is handle-first: winners and history are presented by X handle while claims remain self-custody and wallet-native.',
      },
      {
        q: 'How can anyone verify outcomes?',
        a: 'Outcomes are on-chain. Anyone can verify distributions in an explorer.',
      },
    ],
    [],
  );

  return (
    <XpotPageShell pageTag="home">
      {/* HERO (open layout, minimal framing) */}
      <section className="pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="emerald">
              <ShieldCheck className="h-3.5 w-3.5" />
              Holdings-based
            </Pill>
            <Pill tone="sky">
              <Users className="h-3.5 w-3.5" />
              @handle-first
            </Pill>
            <Pill tone="amber">
              <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
              Final Draw
            </Pill>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/18 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <Radio className="h-3.5 w-3.5" />
              Live
            </span>
          </div>

          <RoyalContractChip mint={mint} />
        </div>

        <MissionBanner />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          {/* LEFT copy */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">
              NO TICKETS · JUST XPOT HOLDINGS
            </p>

            <h1 className="mt-3 text-balance text-[34px] font-semibold leading-[1.05] sm:text-[56px]">
              One protocol.
              <br />
              <span className={GOLD_TEXT}>One daily XPOT draw.</span>
            </h1>

            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-slate-300">
              Daily draws are the heartbeat. <span className="text-slate-100">Final Draw</span> is the ending -{' '}
              <FinalDrawDate className="text-slate-100" />.
              <span className="block mt-2 text-slate-400">
                Day flips at 22:00 Madrid. Winners are public by handle. Proof stays on-chain.
              </span>
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3.5 text-sm`}>
                Enter the hub
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link href={ROUTE_TERMS} className={`${BTN_GHOST} px-5 py-3 text-sm`}>
                Read terms
              </Link>

              <Link
                href={ROUTE_TOKENOMICS_RESERVE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-2 py-2 text-[12px] font-semibold text-slate-400 hover:text-slate-200 transition"
                title="Open Tokenomics (Protocol distribution reserve)"
              >
                <ExternalLink className="h-4 w-4" />
                Open reserve
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Next draw</p>
                <p className="mt-1 font-mono text-sm text-slate-200">{countdown}</p>
                <p className="mt-1 text-[12px] text-slate-400">{cutoffLabel}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Eligibility</p>
                <p className={`mt-1 font-mono text-sm ${GOLD_TEXT}`}>{MIN_ELIGIBLE_XPOT.toLocaleString()} XPOT</p>
                <p className="mt-1 text-[12px] text-slate-400">Hold in a connected wallet</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Run</p>
                <p className={`mt-1 font-mono text-sm ${GOLD_TEXT}`}>DAY {run.day}/{RUN_DAYS}</p>
                <p className="mt-1 text-[12px] text-slate-400">{run.daysRemaining} days remaining</p>
              </div>
            </div>

            {bonusActive ? (
              <div className="mt-4 rounded-2xl border border-emerald-400/18 bg-emerald-500/10 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[12px] font-semibold text-emerald-200">
                    <Sparkles className="inline h-4 w-4 mr-2" />
                    Bonus XPOT active
                  </p>
                  <span className="text-[11px] text-emerald-200/70">Same entry, paid on-chain</span>
                </div>
                <div className="mt-3">
                  <BonusStrip variant="home" />
                </div>
              </div>
            ) : null}
          </div>

          {/* RIGHT: keep the one premium object that matters */}
          <div className={reduceMotion ? '' : 'will-change-transform'}>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur">
              <JackpotPanel variant="standalone" layout="wide" />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2 text-[12px] text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Proof first. Identity first. Ending-first story.
              </div>

              <Link href={ROUTE_HUB} className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-200 hover:text-white transition">
                Claim your entry <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STRIP: How it works (no cards grid) */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <Pill tone="amber">
              <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
              Mechanism
            </Pill>
            <h2 className="mt-3 text-balance text-2xl font-semibold text-slate-50 sm:text-3xl">
              Simple primitive. Serious outcome.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Hold XPOT, link your handle, claim entry in the hub. Winners are paid in XPOT and verifiable on-chain.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="emerald">
              <ShieldCheck className="h-3.5 w-3.5" />
              Proof
            </Pill>
            <Pill tone="sky">
              <Users className="h-3.5 w-3.5" />
              Identity
            </Pill>
            <Pill tone="violet">
              <Timer className="h-3.5 w-3.5" />
              Daily
            </Pill>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">01</p>
            <p className="mt-2 text-sm font-semibold text-slate-100">Hold XPOT</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
              Eligibility is checked on-chain in the hub.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">02</p>
            <p className="mt-2 text-sm font-semibold text-slate-100">Link your handle</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
              Winners and history stay handle-first.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">03</p>
            <p className="mt-2 text-sm font-semibold text-slate-100">Claim entry, verify payout</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
              Paid in XPOT. Proof lives on-chain.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            Built for serious players: clean rules, public arc and provable outcomes.
          </div>

          <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-5 py-2.5 text-sm`}>
            Claim your entry
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* STRIP: Who it's for (lighter) */}
      <section className="mt-10">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
            <Pill tone="amber">
              <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
              Players
            </Pill>
            <p className="mt-3 text-base font-semibold text-slate-50">A run you can feel.</p>
            <p className="mt-2 text-sm text-slate-300">Track the day count, show up daily, build toward the Final Draw.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
            <Pill tone="sky">
              <Globe className="h-3.5 w-3.5" />
              Sponsors
            </Pill>
            <p className="mt-3 text-base font-semibold text-slate-50">Fund moments, not ads.</p>
            <p className="mt-2 text-sm text-slate-300">Sponsor pools with visibility and on-chain distribution proof.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
            <Pill tone="emerald">
              <Zap className="h-3.5 w-3.5" />
              Communities
            </Pill>
            <p className="mt-3 text-base font-semibold text-slate-50">Portable loyalty.</p>
            <p className="mt-2 text-sm text-slate-300">Shared history by handle, still self-custody for claims.</p>
          </div>
        </div>
      </section>

      {/* FAQ (keep minimal) */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
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

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="amber">
              <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
              Final Draw
            </Pill>
            <Pill tone="sky">
              <Users className="h-3.5 w-3.5" />
              Identity
            </Pill>
          </div>
        </div>

        <div className="mt-5">
          <Accordion items={faq} />
        </div>
      </section>

      <XpotFooter />
    </XpotPageShell>
  );
}

export default function HomePage() {
  return (
    <NextDrawProvider>
      <HomePageInner />
    </NextDrawProvider>
  );
}
