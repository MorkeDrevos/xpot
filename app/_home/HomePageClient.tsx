// app/_home/HomePageClient.tsx
'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  createContext,
  useContext,
} from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Crown,
  ExternalLink,
  Globe,
  Info,
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
import RotatingAnnouncement from '@/components/RotatingAnnouncement';
import WinnerAndStageStack from '@/components/WinnerAndStageStack';

import { RUN_DAYS, RUN_START, RUN_END, RUN_START_EU, RUN_END_EU } from '@/lib/xpotRun';

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

const XPOT_SIGN = '✕';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full xpot-btn-vault xpot-focus-gold font-semibold transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.45)] hover:bg-emerald-300 transition';

const GOLD_TEXT = 'text-[rgb(var(--xpot-gold-2))]';
const GOLD_TEXT_DIM = 'text-[rgba(var(--xpot-gold-2),0.85)]';
const GOLD_BORDER = 'border-[rgba(var(--xpot-gold),0.35)]';
const GOLD_BORDER_SOFT = 'border-[rgba(var(--xpot-gold),0.25)]';
const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
const GOLD_BG_WASH_2 = 'bg-[rgba(var(--xpot-gold),0.08)]';
const GOLD_RING_SHADOW = 'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]';

const MIN_ELIGIBLE_XPOT = 100_000;

/* ─────────────────────────────────────────────
   Shared countdown context (single source of truth)
───────────────────────────────────────────── */

type NextDrawState = {
  nowMs: number;
  nextDrawUtcMs: number;
  countdown: string;
  cutoffLabel: string;
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

/* ─────────────────────────────────────────────
   Small UI helpers
───────────────────────────────────────────── */

function Pill({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'sky' | 'violet';
}) {
  const map: Record<string, string> = {
    slate:
      'border-slate-700/70 bg-slate-900/70 text-slate-300 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]',
    emerald:
      'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]',
    amber: `${GOLD_BORDER} ${GOLD_BG_WASH} ${GOLD_TEXT} ${GOLD_RING_SHADOW}`,
    sky: 'border-sky-400/50 bg-sky-500/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.16)]',
    violet:
      'border-violet-400/45 bg-violet-500/10 text-violet-200 shadow-[0_0_0_1px_rgba(139,92,246,0.16)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 leading-none text-[10px] font-semibold uppercase tracking-[0.18em] ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function useBodyMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function TinyTooltip({ label, children }: { label: string; children: ReactNode }) {
  const mounted = useBodyMounted();

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ left: r.left + r.width / 2, top: r.bottom + 10 });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  return (
    <span className="relative inline-flex items-center">
      <span
        ref={anchorRef}
        className="group inline-flex items-center"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>

      {open && pos && mounted && typeof document !== 'undefined' && document.body
        ? createPortal(
            <div
              className="fixed z-[9999] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/85 px-3 py-2 text-[11px] leading-relaxed text-slate-200 shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
              style={{ left: pos.left, top: pos.top }}
              role="tooltip"
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

function PremiumCard({
  children,
  className = '',
  halo = true,
  sheen = false,
}: {
  children: ReactNode;
  className?: string;
  halo?: boolean;
  sheen?: boolean;
}) {
  return (
    <section
      className={[
        'relative overflow-hidden rounded-[32px]',
        'bg-white/[0.03] backdrop-blur-xl',
        'shadow-[0_40px_140px_rgba(0,0,0,0.55)]',
        'ring-1 ring-white/[0.06]',
        sheen ? 'xpot-sheen' : '',
        className,
      ].join(' ')}
    >
      {halo && (
        <div className="pointer-events-none absolute -inset-28 bg-[radial-gradient(circle_at_8%_0%,rgba(16,185,129,0.22),transparent_58%),radial-gradient(circle_at_92%_8%,rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.14),transparent_60%),radial-gradient(circle_at_50%_-10%,rgba(var(--xpot-gold),0.10),transparent_62%)] opacity-90" />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function normalizeHandle(h: string | null | undefined) {
  const s = String(h ?? '').trim();
  if (!s) return '@unknown';
  return s.startsWith('@') ? s : `@${s}`;
}

function shortenAddress(addr: string, left = 6, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

/* ─────────────────────────────────────────────
   Strong 3-step clarity (3 seconds)
───────────────────────────────────────────── */

function Quick3Steps({ countdown, warmup }: { countdown: string; warmup: boolean }) {
  const reduced = useReducedMotion();

  return (
    <div className="mt-4">
      <style jsx global>{`
        @keyframes xpotStepPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
          55% {
            box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.22), 0 0 22px rgba(16, 185, 129, 0.18);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        .xpot-step-pulse {
          animation: xpotStepPulse 2.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .xpot-step-pulse {
            animation: none;
          }
        }
      `}</style>

      <div className="grid gap-2 sm:grid-cols-3">
        <div
          className={[
            'relative overflow-hidden rounded-3xl border border-emerald-400/25 bg-emerald-500/10 ring-1 ring-white/[0.06]',
            !reduced ? 'xpot-step-pulse' : '',
          ].join(' ')}
        >
          <div className="pointer-events-none absolute -inset-24 opacity-80 blur-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.26),transparent_62%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.10),transparent_62%)]" />
          <div className="relative p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-100/90">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-950/30">
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                </span>
                Step 1
              </span>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                Min hold
              </span>
            </div>

            <div className="mt-3 text-balance text-[13px] font-semibold text-slate-50">
              Hold at least{' '}
              <span className="font-mono text-[15px] text-emerald-100">{MIN_ELIGIBLE_XPOT.toLocaleString()}</span>{' '}
              XPOT
            </div>
            <div className="mt-1 text-[12px] leading-relaxed text-emerald-100/80">In your connected wallet.</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-sky-400/25 bg-sky-500/10 ring-1 ring-white/[0.06]">
          <div className="pointer-events-none absolute -inset-24 opacity-75 blur-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.20),transparent_62%),radial-gradient(circle_at_82%_30%,rgba(16,185,129,0.10),transparent_62%)]" />
          <div className="relative p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-sky-100/90">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-950/30">
                  <Wand2 className="h-4 w-4 text-sky-200" />
                </span>
                Step 2
              </span>

              <span className="rounded-full border border-sky-300/20 bg-sky-950/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100/90">
                Enter once
              </span>
            </div>

            <div className="mt-3 text-balance text-[13px] font-semibold text-slate-50">Connect X + wallet in the hub</div>
            <div className="mt-1 text-[12px] leading-relaxed text-sky-100/80">You are in today&apos;s draw.</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[rgba(var(--xpot-gold),0.28)] bg-[rgba(var(--xpot-gold),0.10)] ring-1 ring-white/[0.06]">
          <div className="pointer-events-none absolute -inset-24 opacity-75 blur-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(var(--xpot-gold),0.18),transparent_62%),radial-gradient(circle_at_82%_30%,rgba(56,189,248,0.10),transparent_62%)]" />
          <div className="relative p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-100/90">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl border border-[rgba(var(--xpot-gold),0.22)] bg-slate-950/30">
                  <ShieldCheck className={`h-4 w-4 ${GOLD_TEXT}`} />
                </span>
                Step 3
              </span>

              <span className="rounded-full border border-[rgba(var(--xpot-gold),0.22)] bg-slate-950/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-100/90">
                Proof
              </span>
            </div>

            <div className="mt-3 text-balance text-[13px] font-semibold text-slate-50">Winner published at 22:00 Madrid</div>
            <div className="mt-1 text-[12px] leading-relaxed text-slate-200/85">
              Paid on-chain. Next draw in <span className="font-mono text-slate-100">{countdown}</span>
              {warmup ? <span className={`ml-2 ${GOLD_TEXT_DIM}`}>warm-up</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Premium cosmic backdrop
───────────────────────────────────────────── */

function CosmicHeroBackdrop() {
  return (
    <>
      <style jsx global>{`
        @keyframes xpotHeroRotate {
          0% {
            transform: translateZ(0) rotate(0deg) scale(1);
          }
          100% {
            transform: translateZ(0) rotate(360deg) scale(1);
          }
        }
        @keyframes xpotHeroSheen {
          0% {
            transform: translateX(-25%) translateY(-10%) rotate(8deg);
            opacity: 0;
          }
          20% {
            opacity: 0.28;
          }
          60% {
            opacity: 0.18;
          }
          100% {
            transform: translateX(25%) translateY(10%) rotate(8deg);
            opacity: 0;
          }
        }
        @keyframes xpotConsoleSweep {
          0% {
            transform: translateX(-55%) skewX(-12deg);
            opacity: 0;
          }
          15% {
            opacity: 0.22;
          }
          55% {
            opacity: 0.1;
          }
          100% {
            transform: translateX(55%) skewX(-12deg);
            opacity: 0;
          }
        }
        .xpot-console-sweep {
          position: absolute;
          inset: -40px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 30%,
            rgba(var(--xpot-gold), 0.1) 48%,
            rgba(56, 189, 248, 0.06) 66%,
            transparent 100%
          );
          mix-blend-mode: screen;
          opacity: 0;
          filter: blur(0.2px);
          animation: xpotConsoleSweep 12s ease-in-out infinite;
          z-index: 2;
        }
        .xpot-hero-engine {
          position: absolute;
          inset: -180px;
          pointer-events: none;
          opacity: 0.85;
        }
        .xpot-hero-engine::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 25%, rgba(16, 185, 129, 0.18), transparent 55%),
            radial-gradient(circle at 70% 25%, rgba(56, 189, 248, 0.14), transparent 58%),
            radial-gradient(circle at 55% 70%, rgba(var(--xpot-gold), 0.12), transparent 62%),
            radial-gradient(circle at 30% 80%, rgba(139, 92, 246, 0.12), transparent 60%);
          animation: xpotHeroRotate 44s linear infinite;
          transform-origin: center;
          opacity: 0.95;
        }
        .xpot-hero-engine::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05), transparent 55%);
          opacity: 0.55;
          mix-blend-mode: screen;
        }
        .xpot-hero-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.22;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
          background-size: 260px 260px;
          mix-blend-mode: overlay;
        }
        .xpot-hero-sheen {
          position: absolute;
          inset: -60px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 32%,
            rgba(var(--xpot-gold), 0.08) 50%,
            rgba(56, 189, 248, 0.06) 68%,
            transparent 100%
          );
          transform: rotate(8deg);
          animation: xpotHeroSheen 9.8s ease-in-out infinite;
          mix-blend-mode: screen;
          opacity: 0;
        }

        @keyframes xpotPulseGold {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--xpot-gold), 0);
          }
          50% {
            box-shadow: 0 0 0 1px rgba(var(--xpot-gold), 0.22), 0 0 18px rgba(var(--xpot-gold), 0.18);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--xpot-gold), 0);
          }
        }
        .xpot-warmup-ring {
          animation: xpotPulseGold 2.8s ease-in-out infinite;
          border-radius: 999px;
        }
        @media (prefers-reduced-motion: reduce) {
          .xpot-warmup-ring {
            animation: none;
          }
        }
      `}</style>

      <div className="xpot-hero-engine" aria-hidden />
      <div className="xpot-hero-sheen" aria-hidden />
      <div className="xpot-hero-grain" aria-hidden />
    </>
  );
}

/* ─────────────────────────────────────────────
   Madrid cutoff helpers
───────────────────────────────────────────── */

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

  const get = (type: string, fallback = '0') =>
    Number(parts.find(p => p.type === type)?.value ?? fallback);

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

  const runStartCutoffUtc = getMadridUtcMsFromWallClock(
    RUN_START.y,
    RUN_START.m,
    RUN_START.d,
    RUN_START.hh,
    RUN_START.mm,
    0,
    now,
  );

  const runEndCutoffUtc = getMadridUtcMsFromWallClock(
    RUN_END.y,
    RUN_END.m,
    RUN_END.d,
    RUN_END.hh,
    RUN_END.mm,
    0,
    now,
  );

  const todayCutoffUtc = getMadridUtcMsFromWallClock(p.y, p.m, p.d, 22, 0, 0, now);
  const anchorYmd =
    now.getTime() >= todayCutoffUtc ? { y: p.y, m: p.m, d: p.d } : addYmdDays(p.y, p.m, p.d, -1);

  const started = now.getTime() >= runStartCutoffUtc;

  let day = 0;
  if (started) {
    const diffDays =
      ymdToSerialUtc(anchorYmd.y, anchorYmd.m, anchorYmd.d) -
      ymdToSerialUtc(RUN_START.y, RUN_START.m, RUN_START.d);
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
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
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

/* Reduced motion hook (local) */
function useLocalReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(Boolean(m.matches));
    apply();
    m.addEventListener?.('change', apply);
    return () => m.removeEventListener?.('change', apply);
  }, []);
  return reduced;
}

/* ─────────────────────────────────────────────
   Winners + entries telemetry (public)
───────────────────────────────────────────── */

type WinnerRow = {
  id: string;
  handle: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  wallet: string | null;

  amount?: number | null;
  amountXpot?: number | null;

  drawDate: string | null;
  txUrl?: string | null;
  isPaidOut?: boolean;

  kind?: 'MAIN' | 'BONUS' | null;
  label?: string | null;
};

type EntryRow = {
  id?: string;
  createdAt?: string;
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  verified?: boolean;
};

async function fetchFirstOk<T = any>(urls: string[]): Promise<T | null> {
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) continue;
      const data = (await r.json().catch(() => null)) as T | null;
      if (data) return data;
    } catch {}
  }
  return null;
}

function useLatestWinnerCard() {
  const [winner, setWinner] = useState<WinnerRow | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      const data = await fetchFirstOk<any>([
        '/api/public/winners/latest',
        '/api/public/winners?latest=1',
        '/api/public/winners?limit=1',
        '/api/public/winners',
      ]);

      if (!alive) return;

      let w: WinnerRow | null = null;

      if (data?.ok === true && data?.winner) {
        const x = data.winner;
        const safeId =
          x?.id ??
          x?.winnerId ??
          x?.txSig ??
          x?.txHash ??
          (x?.drawDate ? `win_${String(x.drawDate)}` : 'latest');

        w = {
          id: String(safeId),
          handle: x.handle ?? null,
          name: x.name ?? null,
          avatarUrl: x.avatarUrl ?? null,
          wallet: x.wallet ?? null,
          amountXpot: typeof x.amountXpot === 'number' ? x.amountXpot : null,
          amount: typeof x.amount === 'number' ? x.amount : null,
          drawDate: x.drawDate ?? null,
          txUrl: x.txUrl ?? null,
          isPaidOut: Boolean(x.isPaidOut),
          kind: x.kind ?? null,
          label: x.label ?? null,
        };
      } else if (Array.isArray(data?.winners) && data.winners[0]) {
        const x = data.winners[0] as WinnerRow;
        w = { ...x, id: String((x as any).id ?? (x.drawDate ? `win_${x.drawDate}` : 'latest')) };
      } else if (Array.isArray(data) && data[0]) {
        const x = data[0] as WinnerRow;
        w = { ...x, id: String((x as any).id ?? (x.drawDate ? `win_${x.drawDate}` : 'latest')) };
      }

      setWinner(w && w.id ? w : null);
    }

    load();
    const t = window.setInterval(load, 12_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  return winner;
}

function useLatestEntriesTelemetry() {
  const [entries, setEntries] = useState<EntryRow[]>([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      const data = await fetchFirstOk<any>([
        '/api/public/entries/latest',
        '/api/public/entries?latest=1',
        '/api/public/entries?limit=24',
        '/api/public/entries',
      ]);

      if (!alive) return;

      const arr = Array.isArray(data?.entries)
        ? (data.entries as EntryRow[])
        : Array.isArray(data)
        ? (data as EntryRow[])
        : [];

      setEntries(arr.filter(e => Boolean(e?.handle)));
    }

    load();
    const t = window.setInterval(load, 10_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  return entries;
}

/* ─────────────────────────────────────────────
   Daytime layer + warm-up
───────────────────────────────────────────── */

type DrawPhase = 'daytime' | 'warmup' | 'final_minute' | 'drawing' | 'reveal';

function useDrawPhase(nowMs: number, nextDrawUtcMs: number) {
  const msLeft = nextDrawUtcMs - nowMs;

  const warmup = msLeft > 0 && msLeft <= 2 * 60 * 60 * 1000;
  const finalMinute = msLeft > 0 && msLeft <= 60 * 1000;
  const due = msLeft <= 0;

  return { msLeft, warmup, finalMinute, due };
}

function DaytimeLayerCard({
  entries,
  countdown,
  cutoffLabel,
  warmup,
}: {
  entries: EntryRow[];
  countdown: string;
  cutoffLabel: string;
  warmup: boolean;
}) {
  const [signal, setSignal] = useState<string>('XPOT is building for tonight’s draw');
  const [pulse, setPulse] = useState(0);

  const entryCount = Array.isArray(entries) ? entries.length : 0;

  const milestone = useMemo(() => {
    const marks = [25, 50, 100, 250, 500, 1000];
    const reached = marks.filter(m => entryCount >= m);
    const next = marks.find(m => entryCount < m) ?? null;
    return { reached: reached.at(-1) ?? null, next };
  }, [entryCount]);

  useEffect(() => {
    const lines = [
      'Entry window open',
      'Feed is live',
      'Identity cache warming',
      'Proof index ready',
      'Liquidity signal stable',
    ];

    const warmupLines = [
      'Final window approaching',
      'Lock sequence arming',
      'Winner selection preparing',
      'Ceremony triggers at zero',
    ];

    const t = window.setInterval(() => {
      setPulse(p => p + 1);
      const pickFrom = warmup ? warmupLines : lines;
      const i = Math.floor(Math.random() * pickFrom.length);
      setSignal(pickFrom[i]);
    }, 14_000);

    return () => window.clearInterval(t);
  }, [warmup]);

  const tone = warmup ? 'amber' : 'sky';

  return (
    <div className="relative mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.05]">
      <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_14%_30%,rgba(56,189,248,0.12),transparent_62%),radial-gradient(circle_at_82%_24%,rgba(16,185,129,0.10),transparent_62%),radial-gradient(circle_at_50%_0%,rgba(var(--xpot-gold),0.12),transparent_62%)]" />
      <div className="relative px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pill tone={tone}>
            <Sparkles className="h-3.5 w-3.5" />
            {warmup ? 'Warm-up layer' : 'Daytime layer'}
          </Pill>

          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Next cutoff {cutoffLabel}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] text-slate-300">{signal}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Next draw in <span className="font-mono text-slate-200">{countdown}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px]',
                warmup
                  ? 'border-[rgba(var(--xpot-gold),0.22)] bg-[rgba(var(--xpot-gold),0.08)] text-slate-100'
                  : 'border-white/10 bg-white/[0.03] text-slate-200',
              ].join(' ')}
            >
              <Users className="h-4 w-4 text-slate-300" />
              Live entries <span className="font-mono text-slate-100">{entryCount}</span>
            </span>

            {milestone.next ? (
              <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] text-slate-300">
                Next milestone <span className="font-mono text-slate-100">{milestone.next}</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] text-slate-300">
                Milestones active
              </span>
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute right-4 top-4 h-2 w-2 rounded-full bg-white/10">
          <span
            key={pulse}
            className="absolute inset-0 rounded-full bg-white/20"
            style={{ animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) 1' } as any}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Mission banner
───────────────────────────────────────────── */

function MissionBanner() {
  return (
    <div className="relative border-y border-slate-900/60 bg-slate-950/55 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_18%_20%,rgba(var(--xpot-gold),0.18),transparent_60%),radial-gradient(circle_at_82%_0%,rgba(56,189,248,0.16),transparent_62%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <RotatingAnnouncement reservesHref={ROUTE_TOKENOMICS_RESERVE} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page sections
───────────────────────────────────────────── */

function SectionHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-5 sm:mb-6">
      {eyebrow ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-pretty text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">{title}</h2>
      {desc ? <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-slate-400">{desc}</p> : null}
    </div>
  );
}

function StepCard({
  icon,
  title,
  body,
  tone = 'slate',
}: {
  icon: ReactNode;
  title: string;
  body: string;
  tone?: 'slate' | 'emerald' | 'sky' | 'amber' | 'violet';
}) {
  const border =
    tone === 'emerald'
      ? 'border-emerald-400/20'
      : tone === 'sky'
      ? 'border-sky-400/20'
      : tone === 'amber'
      ? 'border-[rgba(var(--xpot-gold),0.22)]'
      : tone === 'violet'
      ? 'border-violet-400/20'
      : 'border-white/10';

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${border} bg-white/[0.03] p-5 ring-1 ring-white/[0.05]`}>
      <div className="pointer-events-none absolute -inset-24 opacity-75 blur-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.10),transparent_60%),radial-gradient(circle_at_82%_30%,rgba(16,185,129,0.10),transparent_60%),radial-gradient(circle_at_50%_0%,rgba(var(--xpot-gold),0.08),transparent_62%)]" />
      <div className="relative">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40">
          {icon}
        </div>
        <h3 className="text-[14px] font-semibold text-slate-50">{title}</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{body}</p>
      </div>
    </div>
  );
}

function PrimaryCtaRow({ countdown, warmup }: { countdown: string; warmup: boolean }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Link
        href={ROUTE_HUB}
        className={`${BTN_GREEN} group px-6 py-3.5 text-sm ${warmup ? 'xpot-warmup-ring' : ''}`}
        title="Enter the hub"
      >
        Enter today&apos;s XPOT
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <a
        href={XPOT_JUP_SWAP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-[13px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
        title="Buy XPOT on Jupiter"
      >
        Buy XPOT
        <ExternalLink className="h-4 w-4 text-slate-500" />
      </a>

      <div className="ml-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-300">
        <Timer className="h-4 w-4 text-slate-400" />
        Next draw in <span className="font-mono font-semibold text-slate-100">{countdown}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Home page
───────────────────────────────────────────── */

function HomePageInner() {
  const bonusActive = useBonusActive();
  const winnerSpotlight = useLatestWinnerCard();
  const entries = useLatestEntriesTelemetry();

  const SHOW_LIVE_FEED = true;

  const { countdown, cutoffLabel, nowMs, nextDrawUtcMs } = useNextDraw();
  const run = useMemo(() => calcRunProgress(new Date(nowMs)), [nowMs]);

  const { warmup } = useDrawPhase(nowMs, nextDrawUtcMs);

  useEffect(() => {
    const t = run.ended
      ? `XPOT - Final Draw live (${RUN_END_EU})`
      : run.started
      ? `XPOT - Day ${run.day}/${RUN_DAYS} (Next draw ${cutoffLabel})`
      : `XPOT - Run starts ${RUN_START_EU}`;

    document.title = t;
    setMeta(
      'description',
      `XPOT is a daily draw protocol with handle-first identity and on-chain proof. Final draw: ${RUN_END_EU}.`,
    );
  }, [run.day, run.started, run.ended, cutoffLabel]);

  const hero = (
    <section className="relative">
      <div aria-hidden className="h-[calc(var(--xpot-banner-h,56px)+var(--xpot-topbar-h,112px)+14px)]" />
      <MissionBanner />

      <div className="relative overflow-hidden border-y border-slate-900/60 bg-slate-950/20 shadow-[0_60px_220px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.06),rgba(0,0,0,0.60))]" />

        <div className="relative z-10 mx-auto w-full max-w-none px-3 sm:px-6 lg:px-10 2xl:px-14">
          <div className="py-5 sm:py-7">
            <div className="relative w-full overflow-hidden rounded-[38px] border border-slate-900/70 bg-slate-950/35 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <CosmicHeroBackdrop />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.45),rgba(255,255,255,0.08),rgba(56,189,248,0.25),transparent)]" />

              <div className="relative z-10 grid gap-5 p-4 sm:p-6 lg:p-8 lg:items-start lg:grid-cols-[minmax(0,1.0fr)_minmax(0,1.12fr)]">
                {/* LEFT - reduced */}
                <div className="flex flex-col justify-between gap-5 lg:pt-8">
                  <div className="space-y-5">
                    <div className="relative p-2 sm:p-3">
                      <div className="pointer-events-none absolute -inset-28 opacity-85 blur-3xl bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.14),transparent_62%),radial-gradient(circle_at_82%_24%,rgba(56,189,248,0.11),transparent_62%),radial-gradient(circle_at_50%_0%,rgba(var(--xpot-gold),0.14),transparent_62%)]" />

                      {/* status row */}
                      <div className="relative flex flex-wrap items-center justify-between gap-3">
                        <Pill tone={warmup ? 'amber' : 'emerald'}>
                          <Radio className="h-3.5 w-3.5" />
                          {warmup ? 'Warm-up' : 'Live run'}
                        </Pill>

                        <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">
                          handle-first - proof on-chain
                        </span>
                      </div>

                      {/* headline */}
                      <div className="relative mt-4">
                        <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                          One protocol.
                          <br />
                          One daily <span className="xpot-xpotword">XPOT</span> draw.
                        </h1>

                        <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-slate-300">
                          Hold XPOT to qualify. Enter once in the hub. Winner is published handle-first and paid on-chain
                          with proof. Final Draw ends on <FinalDrawDate className="text-slate-100" />.
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] text-slate-200">
                            <ShieldCheck className="h-4 w-4 text-slate-300" />
                            Proof
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] text-slate-200">
                            <Globe className="h-4 w-4 text-slate-300" />
                            Identity
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] text-slate-200">
                            <Zap className="h-4 w-4 text-slate-300" />
                            Daily
                          </span>
                        </div>

                        <PrimaryCtaRow countdown={countdown} warmup={warmup} />
                      </div>
                    </div>

                    {/* MOBILE order: feed then jackpot then bonus */}
                    <div className="grid gap-4 lg:hidden">
                      {SHOW_LIVE_FEED ? <WinnerAndStageStack winner={winnerSpotlight} entries={entries} /> : null}

                      <PremiumCard className="p-4" halo sheen>
                        <div className="xpot-console-sweep" aria-hidden />
                        <div className="relative z-10">
                          <JackpotPanel variant="standalone" layout="wide" />
                        </div>
                      </PremiumCard>

                      {bonusActive ? (
                        <PremiumCard className="p-4" halo={false}>
                          <BonusStrip />
                        </PremiumCard>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* RIGHT (desktop only) - reduced to just the 2 core modules */}
                <div className="hidden gap-4 lg:grid">
                  {SHOW_LIVE_FEED ? <WinnerAndStageStack winner={winnerSpotlight} entries={entries} /> : null}

                  <PremiumCard className="p-5 sm:p-6" halo sheen>
                    <div className="xpot-console-sweep" aria-hidden />
                    <div className="relative z-10">
                      <JackpotPanel variant="standalone" layout="wide" />
                    </div>
                  </PremiumCard>

                  {bonusActive ? (
                    <PremiumCard className="p-5 sm:p-6" halo={false}>
                      <BonusStrip />
                    </PremiumCard>
                  ) : null}
                </div>
              </div>

              {/* Keep ceremony overlay as-is (it is not "busy" because it is conditional) */}
              {/* If you want it only on desktop later, we can gate it. */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <XpotPageShell pageTag="home" fullBleedTop={hero}>
      {/* WHAT XPOT IS - now holds the removed blocks */}
      <section className="mt-8">
        <SectionHeader
          eyebrow="3 seconds"
          title="What XPOT is"
          desc={`Hold ${MIN_ELIGIBLE_XPOT.toLocaleString()} XPOT, enter once in the hub, and you are in the daily draw. Winner is published with on-chain proof.`}
        />

        {/* moved from hero */}
        <Quick3Steps countdown={countdown} warmup={warmup} />

        <div className="mt-4 relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 ring-1 ring-white/[0.05]">
          <div className="pointer-events-none absolute -inset-12 opacity-75 blur-3xl bg-[radial-gradient(circle_at_18%_40%,rgba(16,185,129,0.22),transparent_60%),radial-gradient(circle_at_86%_30%,rgba(56,189,248,0.10),transparent_62%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-100/80">Eligibility</p>
              <p className="mt-1 text-[12px] text-emerald-100/90">
                Hold at least{' '}
                <span className="font-mono text-[13px] text-emerald-100">{MIN_ELIGIBLE_XPOT.toLocaleString()}</span>{' '}
                XPOT to enter.
              </p>
            </div>

            <TinyTooltip label="Eligibility is checked in the hub when you connect X + wallet.">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-950/30 px-3 py-1.5 text-[11px] text-emerald-100/90">
                <Info className="h-3.5 w-3.5 text-emerald-100/70" />
                Verified in hub
              </span>
            </TinyTooltip>
          </div>
        </div>

        {/* moved from hero */}
        <DaytimeLayerCard entries={entries} countdown={countdown} cutoffLabel={cutoffLabel} warmup={warmup} />

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <StepCard
            icon={<Users className="h-5 w-5 text-slate-200" />}
            title="Identity is handle-first"
            body="Your @handle is the public identity. Wallet proof is used for verification."
            tone="sky"
          />
          <StepCard
            icon={<Timer className="h-5 w-5 text-slate-200" />}
            title="Daily cutoff at 22:00 Madrid"
            body="One cadence. One daily moment. Countdown on the homepage and in the hub."
            tone="emerald"
          />
          <StepCard
            icon={<ShieldCheck className="h-5 w-5 text-slate-200" />}
            title="Payout is verifiable"
            body="When a winner is paid, the transaction link is shown and can be verified on-chain."
            tone="amber"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <PremiumCard className="p-6" halo>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Pill tone="amber">
                <Sparkles className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
                Why traders care
              </Pill>
              <a
                href={XPOT_DEXSCREENER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] text-slate-200 hover:bg-white/[0.06] transition"
              >
                Chart
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              </a>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4 ring-1 ring-white/[0.05]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Simple loop</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                  Hold XPOT, enter daily, watch winners, verify payout. Clear mechanics, public proof.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4 ring-1 ring-white/[0.05]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Live surface</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                  Latest winner and live entries show activity at a glance, with real avatars for social proof.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3 text-sm`}>
                Enter today&apos;s XPOT
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </PremiumCard>

          <PremiumCard className="p-6" halo={false}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Quick links</p>
            <div className="mt-4 grid gap-2">
              <a
                href={XPOT_JUP_SWAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-slate-100 hover:bg-white/[0.06] transition"
              >
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-200" />
                  Buy on Jupiter
                </span>
                <ExternalLink className="h-4 w-4 text-slate-500" />
              </a>

              <a
                href={XPOT_SOLSCAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-slate-100 hover:bg-white/[0.06] transition"
              >
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sky-200" />
                  Explorer (Solscan)
                </span>
                <ExternalLink className="h-4 w-4 text-slate-500" />
              </a>

              <Link
                href={ROUTE_TOKENOMICS_RESERVE}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-slate-100 hover:bg-white/[0.06] transition"
              >
                <span className="inline-flex items-center gap-2">
                  <Crown className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                  Reserves
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Link>

              <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/25 p-4 ring-1 ring-white/[0.05]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Official mint</p>
                <p className="mt-2 font-mono text-[12px] text-slate-200">{shortenAddress(XPOT_CA, 10, 10)}</p>
              </div>
            </div>
          </PremiumCard>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <SectionHeader
          eyebrow="FAQ"
          title="Common questions"
          desc="The homepage stays simple. The hub contains the entry and verification flow."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <PremiumCard className="p-6" halo={false}>
            <h3 className="text-[14px] font-semibold text-slate-50">Do I need to buy tickets?</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
              No. Eligibility is based on XPOT holdings. Connect in the hub to check and enter.
            </p>
          </PremiumCard>

          <PremiumCard className="p-6" halo={false}>
            <h3 className="text-[14px] font-semibold text-slate-50">How do I verify a payout?</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
              Winner cards show a transaction link when paid. Open it in the explorer for proof.
            </p>
          </PremiumCard>

          <PremiumCard className="p-6" halo={false}>
            <h3 className="text-[14px] font-semibold text-slate-50">Why show avatars?</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
              It makes the feed instantly human. XPOT is handle-first, so social identity matters.
            </p>
          </PremiumCard>

          <PremiumCard className="p-6" halo={false}>
            <h3 className="text-[14px] font-semibold text-slate-50">When is the Final Draw?</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
              Final draw is scheduled for {String(RUN_END_EU)}. Countdown always shows the next daily cutoff.
            </p>
          </PremiumCard>
        </div>

        <div className="mt-6">
          <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3.5 text-sm`}>
            Go to the hub
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <XpotFooter />
    </XpotPageShell>
  );
}

export default function HomePageClient() {
  return (
    <NextDrawProvider>
      <HomePageInner />
    </NextDrawProvider>
  );
}
