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
  Blocks,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Crown,
  Globe,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
  Zap,
  Timer,
  Radio,
  ExternalLink,
  TrendingUp,
  BadgeCheck,
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';
import XpotFooter from '@/components/XpotFooter';
import FinalDrawDate from '@/components/FinalDrawDate';
import RotatingAnnouncement from '@/components/RotatingAnnouncement';

import { RUN_DAYS, RUN_START, RUN_END, RUN_START_EU, RUN_END_EU } from '@/lib/xpotRun';

const ROUTE_HUB = '/hub';
const ROUTE_TERMS = '/terms';
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
const GOLD_GLOW_SHADOW = 'shadow-[0_0_10px_rgba(var(--xpot-gold),0.85)]';

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

function TinyTooltip({ label, children }: { label: string; children: ReactNode }) {
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

      {open && pos
        ? createPortal(
            <div
              className="
                fixed z-[9999]
                -translate-x-1/2
                rounded-2xl border border-white/10 bg-black/85 px-3 py-2
                text-[11px] leading-relaxed text-slate-200
                shadow-[0_30px_100px_rgba(0,0,0,0.65)]
              "
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
        <div
          className="
            pointer-events-none absolute -inset-28
            bg-[radial-gradient(circle_at_8%_0%,rgba(16,185,129,0.22),transparent_58%),
                radial-gradient(circle_at_92%_8%,rgba(139,92,246,0.18),transparent_60%),
                radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.14),transparent_60%),
                radial-gradient(circle_at_50%_-10%,rgba(var(--xpot-gold),0.10),transparent_62%)]
            opacity-90
          "
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />
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
  value: ReactNode;
  tone?: 'slate' | 'emerald' | 'sky' | 'amber' | 'violet';
}) {
  const toneCls =
    tone === 'emerald'
      ? 'text-emerald-200'
      : tone === 'sky'
      ? 'text-sky-200'
      : tone === 'amber'
      ? `text-[rgb(var(--xpot-gold-2))]`
      : tone === 'violet'
      ? 'text-violet-200'
      : 'text-slate-200';

  return (
    <div className="rounded-2xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.05]">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className={`mt-1 font-mono text-sm ${toneCls}`}>{value}</div>
    </div>
  );
}

function shortenAddress(addr: string, left = 6, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
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
              border ${GOLD_BORDER_SOFT} ${GOLD_BG_WASH_2}
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
          filter: blur(0px);
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
    } catch {
      // keep trying fallbacks
    }
  }
  return null;
}

function formatIsoToMadridYmd(iso: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function formatXpotAmount(amount: number | null | undefined) {
  const n = typeof amount === 'number' && Number.isFinite(amount) ? amount : 1_000_000;
  return `${XPOT_SIGN}${n.toLocaleString()}`;
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
        w = { ...x, id: String(x.id ?? (x.drawDate ? `win_${x.drawDate}` : 'latest')) };
      } else if (Array.isArray(data) && data[0]) {
        const x = data[0] as WinnerRow;
        w = { ...x, id: String(x.id ?? (x.drawDate ? `win_${x.drawDate}` : 'latest')) };
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

function Avatar({ src, label, size = 34 }: { src?: string | null; label: string; size?: number }) {
  const initials = useMemo(() => {
    const s = (label || '').replace(/^@/, '').trim();
    if (!s) return 'X';
    return s.slice(0, 2).toUpperCase();
  }, [label]);

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]"
      style={{ width: size, height: size }}
      title={label}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-mono text-[12px] text-slate-200">
          {initials}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.06]" />
    </div>
  );
}

function EnteringTheStage({ entries }: { entries: EntryRow[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.05]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <Pill tone="sky">
            <Users className="h-3.5 w-3.5" />
            Entering the stage
          </Pill>
          <span className="text-[11px] text-slate-400">Latest entries</span>
        </div>

        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">live feed</span>
      </div>

      <div className="px-4 pb-4">
        {entries && entries.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {entries.slice(0, 18).map(e => {
              const key = `${e.id ?? ''}_${e.handle}_${e.createdAt ?? ''}`;
              return (
                <div
                  key={key}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1"
                >
                  <Avatar src={e.avatarUrl} label={e.handle} size={28} />
                  <span className="max-w-[120px] truncate text-[12px] text-slate-200">{e.handle}</span>
                  {e.verified ? <BadgeCheck className="h-4 w-4 text-sky-300/90" /> : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400">
            No entries in the live feed yet.
          </div>
        )}
      </div>
    </div>
  );
}

function WinnerSpotlight({ winner, compact = false }: { winner: WinnerRow | null; compact?: boolean }) {
  const label = winner
    ? winner.handle ?? (winner.wallet ? shortenAddress(winner.wallet, 6, 6) : 'winner')
    : 'winner';

  const ymd = winner?.drawDate ? formatIsoToMadridYmd(winner.drawDate) : null;
  const paid = Boolean(winner?.isPaidOut);

  const amountResolved =
    typeof winner?.amountXpot === 'number'
      ? winner.amountXpot
      : typeof winner?.amount === 'number'
      ? winner.amount
      : 1_000_000;

  const amt = formatXpotAmount(amountResolved);

  const pad = compact ? 'px-4 py-3' : 'px-5 py-4';
  const avatarSize = compact ? 34 : 44;
  const titleSize = compact ? 'text-[13px]' : 'text-[14px]';
  const payoutSize = compact ? 'text-[16px]' : 'text-[18px]';

  return (
    <div className="relative mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/30 ring-1 ring-white/[0.05]">
      <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(var(--xpot-gold),0.20),transparent_62%),radial-gradient(circle_at_82%_30%,rgba(56,189,248,0.10),transparent_62%)]" />
      <div className={`relative ${pad}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pill tone="amber">
            <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
            Latest winner
          </Pill>

          <span
            className={[
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
              paid
                ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                : 'border-amber-400/20 bg-amber-500/10 text-amber-200',
            ].join(' ')}
          >
            <span className={`h-2 w-2 rounded-full ${paid ? 'bg-emerald-400' : 'bg-amber-300'}`} />
            {paid ? 'Paid' : 'Awaiting payout'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar src={winner?.avatarUrl} label={winner?.handle ?? label} size={avatarSize} />
            <div className="leading-tight">
              <div className={`${titleSize} font-semibold text-slate-50`}>
                {winner ? label : 'Waiting for winner sync'}
              </div>
              <div className="mt-1 text-[12px] text-slate-400">
                {winner ? (
                  <>
                    {ymd ? <span className="font-mono">{ymd}</span> : null}
                    {winner.wallet ? (
                      <>
                        <span className="text-slate-700"> • </span>
                        <span className="font-mono">{shortenAddress(winner.wallet, 7, 7)}</span>
                      </>
                    ) : null}
                    {winner.label ? (
                      <>
                        <span className="text-slate-700"> • </span>
                        <span className="text-slate-300">{winner.label}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  <span>Winner will appear as soon as the public endpoint is live.</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-[10px] uppercase tracking-[0.18em] ${GOLD_TEXT_DIM}`}>Payout</div>
            <div className={`mt-1 font-mono ${payoutSize} ${GOLD_TEXT}`}>{amt}</div>

            <div className="mt-2 flex flex-wrap justify-end gap-2">
              {winner?.txUrl ? (
                <a
                  href={winner.txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-200 hover:bg-white/[0.06] transition"
                >
                  View payout tx
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                </a>
              ) : (
                <span className="text-[11px] text-slate-500">tx link will appear after payout</span>
              )}
            </div>
          </div>
        </div>

        {!paid && !compact ? (
          <p className="mt-3 text-[12px] text-slate-400">
            Payout is performed by ops and then the on-chain transaction is published here.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Control room (read-only live view)
───────────────────────────────────────────── */

function LiveControlRoom({
  countdown,
  cutoffLabel,
  runLine,
}: {
  countdown: string;
  cutoffLabel: string;
  runLine: string;
}) {
  const reduced = useLocalReducedMotion();
  const [tick, setTick] = useState(0);

  const [lines, setLines] = useState<string[]>(() => buildInitialLines(countdown, cutoffLabel, runLine));

  useEffect(() => {
    const t = window.setInterval(() => setTick(v => v + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setLines(prev => updateLines(prev, tick, countdown, cutoffLabel, runLine));
  }, [tick, countdown, cutoffLabel, runLine]);

  const scanCls = reduced ? '' : 'xpot-cr-scan';

  return (
    <div className="relative">
      <style jsx global>{`
        @keyframes xpotScan {
          0% {
            transform: translateY(-18%);
            opacity: 0;
          }
          18% {
            opacity: 0.22;
          }
          55% {
            opacity: 0.1;
          }
          100% {
            transform: translateY(118%);
            opacity: 0;
          }
        }
        @keyframes xpotFlicker {
          0% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.75;
          }
          100% {
            opacity: 0.35;
          }
        }
        .xpot-cr-scan {
          position: relative;
          isolation: isolate;
        }
        .xpot-cr-scan::before {
          content: '';
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: 18px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(16, 185, 129, 0.1),
            rgba(56, 189, 248, 0.07),
            transparent
          );
          opacity: 0;
          transform: translateY(-20%);
          animation: xpotScan 5.6s ease-in-out infinite;
          mix-blend-mode: screen;
          z-index: 0;
        }
        .xpot-cr-scan > * {
          position: relative;
          z-index: 1;
        }
        .xpot-cr-cursor {
          display: inline-block;
          width: 8px;
          height: 14px;
          margin-left: 6px;
          background: rgba(16, 185, 129, 0.75);
          box-shadow: 0 0 16px rgba(52, 211, 153, 0.6);
          border-radius: 2px;
          vertical-align: -2px;
          animation: xpotFlicker 1.1s ease-in-out infinite;
        }
      `}</style>

      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-emerald-200/80">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          Control Room - session view
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-emerald-200/70">read-only</span>
        </span>
      </div>

      <div
        className={[
          'relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-950/20',
          'p-4 pb-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)]',
          scanCls,
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -inset-20 opacity-65 blur-3xl bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(circle_at_88%_30%,rgba(56,189,248,0.12),transparent_65%)]" />

        <pre className="relative z-10 max-h-60 overflow-auto whitespace-pre pr-2 pb-1 font-mono text-[11px] leading-relaxed text-emerald-100/90">
          {lines.join('\n')}
        </pre>

        <div className="relative z-10 mt-2 text-[11px] leading-snug text-emerald-200/75">
          Live cockpit feed - updates every 1s
          <span className="xpot-cr-cursor" />
        </div>
      </div>

      <p className="mt-3 text-[12px] text-slate-400">
        Read-only cockpit view. Run is public. Identity stays handle-first. Proof stays on-chain.
      </p>
    </div>
  );
}

function buildInitialLines(countdown: string, cutoffLabel: string, runLine: string) {
  return [
    `> XPOT_PROTOCOL`,
    `  run:            ${runLine}`,
    `  primitive:      daily reward selection`,
    `  eligibility:    hold XPOT (min threshold applies)`,
    `  identity:       @handle-first (not wallet profiles)`,
    `  proof:          on-chain payout verification`,
    ``,
    `> NEXT_DRAW`,
    `  in:             ${countdown}  (${cutoffLabel})`,
    ``,
    `> SESSION`,
    `  heartbeat:      ok`,
    `  status:         run telemetry`,
  ];
}

function updateLines(prev: string[], tick: number, countdown: string, cutoffLabel: string, runLine: string) {
  const next = [...prev];

  const runIdx = next.findIndex(l => l.trim().startsWith('run:'));
  if (runIdx !== -1) next[runIdx] = `  run:            ${runLine}`;

  const idx = next.findIndex(l => l.trim().startsWith('in:'));
  if (idx !== -1) next[idx] = `  in:             ${countdown}  (${cutoffLabel})`;

  const hbIdx = next.findIndex(l => l.trim().startsWith('heartbeat:'));
  if (hbIdx !== -1) next[hbIdx] = `  heartbeat:      ${tick % 9 === 0 ? 'sync' : 'ok'}`;

  const stIdx = next.findIndex(l => l.trim().startsWith('status:'));
  if (stIdx !== -1) {
    const modes = ['run telemetry', 'proof verify', 'pool telemetry', 'entry window open'];
    next[stIdx] = `  status:         ${modes[tick % modes.length]}`;
  }

  if (tick > 0 && tick % 7 === 0) {
    const stamp = String(tick).padStart(4, '0');
    const events = [
      `tick ${stamp}: eligibility index ok`,
      `tick ${stamp}: identity cache warm`,
      `tick ${stamp}: proof cache updated`,
      `tick ${stamp}: entry window open`,
      `tick ${stamp}: liquidity signal stable`,
    ];
    const line = `  log:            ${events[tick % events.length]}`;
    const sessBlockEnd = next.length;
    const insertAt = Math.max(0, sessBlockEnd - 1);
    next.splice(insertAt, 0, line);

    while (next.length > 22) next.splice(insertAt, 1);
  }

  return next;
}

// BonusVault unchanged...
function BonusVault({ children, spotlight = true }: { children: ReactNode; spotlight?: boolean }) {
  const halo = spotlight ? 'opacity-95 blur-2xl' : 'opacity-75 blur-2xl';

  return (
    <div className="relative">
      <style jsx global>{`
        @keyframes xpotBonusSheen {
          0% {
            transform: translateX(-55%) skewX(-12deg);
            opacity: 0;
          }
          18% {
            opacity: 0.24;
          }
          60% {
            opacity: 0.12;
          }
          100% {
            transform: translateX(55%) skewX(-12deg);
            opacity: 0;
          }
        }
        .xpot-bonus-sheen {
          position: absolute;
          inset: -40px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 30%,
            rgba(139, 92, 246, 0.14) 48%,
            rgba(244, 63, 94, 0.08) 62%,
            rgba(56, 189, 248, 0.06) 74%,
            transparent 100%
          );
          mix-blend-mode: screen;
          opacity: 0;
          animation: xpotBonusSheen 10.5s ease-in-out infinite;
          z-index: 2;
        }
      `}</style>

      <div
        className={[
          'pointer-events-none absolute -inset-12',
          halo,
          "bg-[radial-gradient(circle_at_22%_38%,rgba(139,92,246,0.30),transparent_64%),radial-gradient(circle_at_78%_26%,rgba(244,63,94,0.12),transparent_60%),radial-gradient(circle_at_72%_30%,rgba(56,189,248,0.12),transparent_64%),radial-gradient(circle_at_85%_80%,rgba(var(--xpot-gold),0.12),transparent_66%)]",
        ].join(' ')}
      />

      <div className="relative overflow-hidden rounded-[28px] bg-white/[0.03] ring-1 ring-white/[0.06] shadow-[0_30px_110px_rgba(0,0,0,0.45)]">
        <div className="xpot-bonus-sheen" />
        <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-violet-400/25" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(139,92,246,0.55),rgba(var(--xpot-gold),0.30),rgba(56,189,248,0.25),transparent)]" />

        <div className="relative p-3 sm:p-4">
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

          <div className="relative">{children}</div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-slate-300">Bonus window is live - same entry, extra payout, proof on-chain.</p>

            <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200 ring-1 ring-violet-400/20">
              <Sparkles className="h-3.5 w-3.5" />
              Vault reveal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParallaxConsoleCard({
  children,
  stickyTop = 'calc(var(--xpot-banner-h,56px)+var(--xpot-topbar-h,112px)+24px)',
}: {
  children: ReactNode;
  stickyTop?: string;
}) {
  const reduced = useLocalReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const yRaw = useTransform(scrollYProgress, [0, 1], [10, -14]);
  const y = useSpring(yRaw, { stiffness: 120, damping: 24, mass: 0.7 });

  const tiltRaw = useTransform(scrollYProgress, [0, 1], [0.6, -0.6]);
  const tilt = useSpring(tiltRaw, { stiffness: 110, damping: 26, mass: 0.8 });

  return (
    <div ref={ref} className="lg:sticky lg:self-start" style={{ top: stickyTop }}>
      <motion.div
        style={
          reduced
            ? undefined
            : {
                y,
                rotateX: tilt as any,
                transformPerspective: 1200,
              }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}

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

function HomePageInner() {
  const bonusActive = useBonusActive();

  const winnerSpotlight = useLatestWinnerCard();
  const entries = useLatestEntriesTelemetry();

  const SHOW_LIVE_FEED = true;

  const [mint, setMint] = useState(XPOT_CA);
  useEffect(() => setMint(XPOT_CA), []);

  const { countdown, cutoffLabel, nowMs } = useNextDraw();
  const run = useMemo(() => calcRunProgress(new Date(nowMs)), [nowMs]);

  const runLine = useMemo(() => `DAY ${run.day}/${RUN_DAYS}`, [run.day]);

  const runEndDateOnly = useMemo(() => {
    return String(RUN_END_EU).replace(/\s\d{2}:\d{2}\s*\(Madrid\)\s*$/, '');
  }, []);

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

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="py-5 sm:py-7">
            <div className="relative w-full overflow-hidden rounded-[38px] border border-slate-900/70 bg-slate-950/35 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <CosmicHeroBackdrop />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.45),rgba(255,255,255,0.08),rgba(56,189,248,0.25),transparent)]" />

              <div
                className="
                  relative z-10
                  grid gap-6 p-4 sm:p-6 lg:p-8
                  lg:items-start
                  lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.48fr)]
                "
              >
                {/* LEFT */}
                <div className="flex flex-col justify-between gap-6 lg:pt-8">
                  <div className="space-y-6">
                    <div className="relative p-2 sm:p-3">
                      <div className="pointer-events-none absolute -inset-28 opacity-85 blur-3xl bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.14),transparent_62%),radial-gradient(circle_at_82%_24%,rgba(56,189,248,0.11),transparent_62%),radial-gradient(circle_at_50%_0%,rgba(var(--xpot-gold),0.14),transparent_62%)]" />
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.55),rgba(255,255,255,0.10),rgba(16,185,129,0.26),transparent)]" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.16),rgba(var(--xpot-gold),0.22),transparent)] opacity-70" />

                      <div className="relative flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">
                          NO TICKETS · JUST XPOT HOLDINGS
                        </p>
                      </div>

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

                      {/* MOBILE: compact winner + jackpot immediately after H1 */}
                      <div className="mt-4 grid gap-4 lg:hidden">
                        {SHOW_LIVE_FEED ? <WinnerSpotlight winner={winnerSpotlight} compact /> : null}

                        <PremiumCard className="p-4" halo sheen>
                          <div className="xpot-console-sweep" aria-hidden />
                          <div className="relative z-10">
                            <JackpotPanel variant="standalone" layout="wide" />
                          </div>
                        </PremiumCard>
                      </div>

                      {/* Desktop hero flow */}
                      {SHOW_LIVE_FEED ? (
                        <div className="hidden lg:block">
                          <WinnerSpotlight winner={winnerSpotlight} />
                        </div>
                      ) : null}

                      {SHOW_LIVE_FEED ? <EnteringTheStage entries={entries} /> : null}

                      <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 ring-1 ring-white/[0.05]">
                        <div
                          className="pointer-events-none absolute -inset-10 opacity-80 blur-2xl"
                          style={{
                            background:
                              'radial-gradient(circle_at_18%_40%, rgba(110,231,249,0.10), transparent 55%), radial-gradient(circle_at_86%_30%, rgba(16,185,129,0.10), transparent 52%)',
                          }}
                        />

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

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3.5 text-sm`} title="Enter the hub">
                          Enter the hub
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Your lower LEFT blocks unchanged... */}
                  </div>

                  {/* Your stats + contract + trade blocks unchanged... */}
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
                  <ParallaxConsoleCard>
                    <motion.div style={reduceMotion ? undefined : { boxShadow: depthShadow as any }}>
                      <PremiumCard className="p-5 sm:p-6" halo sheen>
                        <div className="xpot-console-sweep" aria-hidden />
                        <div className="relative z-10">
                          <JackpotPanel variant="standalone" layout="wide" />
                        </div>
                      </PremiumCard>
                    </motion.div>
                  </ParallaxConsoleCard>

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
      {/* (unchanged below) */}
      <section className="mt-7">{/* ... unchanged ... */}</section>

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
