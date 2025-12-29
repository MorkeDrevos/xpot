// app/page.tsx
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

// Optional overrides (recommended once you know the exact pair/chart links)
const XPOT_JUP_SWAP_URL =
  process.env.NEXT_PUBLIC_XPOT_JUP_SWAP_URL || `https://jup.ag/?sell=So11111111111111111111111111111111111111112&buy=${XPOT_CA}`;

const XPOT_DEXSCREENER_URL =
  process.env.NEXT_PUBLIC_XPOT_DEXSCREENER_URL || `https://dexscreener.com/solana/${XPOT_CA}`;

const XPOT_SOLSCAN_URL =
  process.env.NEXT_PUBLIC_XPOT_SOLSCAN_URL || `https://solscan.io/token/${XPOT_CA}`;

// XPOT denomination glyph (use for token-native amounts, keep $ only for USD)
const XPOT_SIGN = '✕';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full xpot-btn-vault xpot-focus-gold font-semibold transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.45)] hover:bg-emerald-300 transition';

// Vault-gold helpers (avoid tailwind amber mapping issues)
const GOLD_TEXT = 'text-[rgb(var(--xpot-gold-2))]';
const GOLD_TEXT_DIM = 'text-[rgba(var(--xpot-gold-2),0.85)]';
const GOLD_BORDER = 'border-[rgba(var(--xpot-gold),0.35)]';
const GOLD_BORDER_SOFT = 'border-[rgba(var(--xpot-gold),0.25)]';
const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
const GOLD_BG_WASH_2 = 'bg-[rgba(var(--xpot-gold),0.08)]';
const GOLD_RING_SHADOW = 'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]';
const GOLD_GLOW_SHADOW = 'shadow-[0_0_10px_rgba(var(--xpot-gold),0.85)]';

// Eligibility threshold (token-native)
const MIN_ELIGIBLE_XPOT = 100_000;

// ─────────────────────────────────────────────
// Shared countdown context (single source of truth)
// ─────────────────────────────────────────────

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

  // Tick on the exact second boundary (prevents drift / jitter)
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
    } catch {
      // ignore
    }
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

            <span className="font-mono text-[12px] text-slate-100/90">
              {shortenAddress(mint, 6, 6)}
            </span>
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

          <p className="mt-3 font-mono text-[11px] text-slate-500">
            mint: {shortenAddress(mint, 8, 8)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Bullet({
  children,
  tone = 'emerald',
}: {
  children: ReactNode;
  tone?: 'emerald' | 'sky' | 'amber' | 'violet';
}) {
  const dot =
    tone === 'sky'
      ? 'bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]'
      : tone === 'amber'
      ? `bg-[rgb(var(--xpot-gold-2))] ${GOLD_GLOW_SHADOW}`
      : tone === 'violet'
      ? 'bg-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.9)]'
      : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]';

  return (
    <li className="flex gap-3 text-sm text-slate-300">
      <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span>{children}</span>
    </li>
  );
}

function Step({
  n,
  title,
  desc,
  icon,
  tone = 'emerald',
  tag,
}: {
  n: string;
  title: string;
  desc: string;
  icon: ReactNode;
  tone?: 'emerald' | 'sky' | 'amber' | 'violet';
  tag: string;
}) {
  const ring =
    tone === 'sky'
      ? 'border-sky-500/25 bg-sky-950/25'
      : tone === 'amber'
      ? `border-[rgba(var(--xpot-gold),0.25)] bg-[rgba(var(--xpot-gold),0.06)]`
      : tone === 'violet'
      ? 'border-violet-500/25 bg-violet-950/25'
      : 'border-emerald-500/25 bg-emerald-950/30';

  const tagTone =
    tone === 'sky'
      ? 'text-sky-200 border-sky-500/25 bg-sky-500/10'
      : tone === 'amber'
      ? `${GOLD_TEXT} ${GOLD_BORDER_SOFT} ${GOLD_BG_WASH} ${GOLD_RING_SHADOW}`
      : tone === 'violet'
      ? 'text-violet-200 border-violet-500/25 bg-violet-500/10'
      : 'text-emerald-200 border-emerald-500/25 bg-emerald-500/10';

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-5">
      <div className="pointer-events-none absolute -inset-24 opacity-60 blur-3xl bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.10),transparent_55%)]" />

      <div className="relative flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Step {n}</span>

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${tagTone}`}
        >
          {tag}
        </span>
      </div>

      <div className="relative mt-4 flex items-center gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${ring}`}>
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="grid gap-3">
      {items.map((it, idx) => {
        const isOpen = open === idx;

        return (
          <div key={it.q} className="overflow-hidden rounded-[22px] bg-white/[0.03] ring-1 ring-white/[0.06]">
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
                  transition={{ duration: 0.22 }}
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

/* ─────────────────────────────────────────────
   Premium cosmic backdrop (hero engine + sweep)
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
        @keyframes xpotLivePulse {
          0% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.25);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(52, 211, 153, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
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
        .xpot-live-ring {
          animation: xpotLivePulse 2.2s ease-in-out infinite;
        }

        @keyframes xpotRoyalSheen {
          0% {
            transform: translateX(-55%) skewX(-12deg);
            opacity: 0;
          }
          18% {
            opacity: 0.22;
          }
          60% {
            opacity: 0.12;
          }
          100% {
            transform: translateX(55%) skewX(-12deg);
            opacity: 0;
          }
        }
        .xpot-royal-sheen {
          position: absolute;
          inset: -40px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 30%,
            rgba(var(--xpot-gold), 0.10) 50%,
            rgba(56, 189, 248, 0.05) 70%,
            transparent 100%
          );
          mix-blend-mode: screen;
          animation: xpotRoyalSheen 14s ease-in-out infinite;
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
  if (typeof document === 'undefined') return;
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
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(Boolean(m.matches));
    apply();
    m.addEventListener?.('change', apply);
    return () => m.removeEventListener?.('change', apply);
  }, []);
  return reduced;
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

  const live = true;
  const pulseCls = reduced ? '' : 'animate-[xpotPulse_2.6s_ease-in-out_infinite]';
  const scanCls = reduced ? '' : 'xpot-cr-scan';

  return (
    <div className="relative">
      <style jsx global>{`
        @keyframes xpotPulse {
          0% {
            transform: translateZ(0) scale(1);
            opacity: 0.85;
          }
          50% {
            transform: translateZ(0) scale(1.02);
            opacity: 1;
          }
          100% {
            transform: translateZ(0) scale(1);
            opacity: 0.85;
          }
        }
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
          <span
            className={[
              'inline-flex items-center gap-2 rounded-full border border-emerald-400/18 bg-emerald-500/10 px-3 py-1',
              'text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200',
              live ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.18)]' : '',
            ].join(' ')}
          >
            <Radio className={`h-3.5 w-3.5 ${pulseCls}`} />
            LIVE
          </span>
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

        {/* FIX: was overflow-hidden causing half-clipped last line. Now scrollable + tiny padding to prevent crop */}
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
  // LAST_WINNERS should always look "current" (relative to Madrid cutoff)
  const now = new Date();
  const p = getMadridParts(now);

  // If we're before today's 22:00 Madrid cutoff, the latest completed draw is "yesterday" (Madrid).
  const todayCutoffUtc = getMadridUtcMsFromWallClock(p.y, p.m, p.d, 22, 0, 0, now);
  const lastDrawYmd = now.getTime() >= todayCutoffUtc ? { y: p.y, m: p.m, d: p.d } : addYmdDays(p.y, p.m, p.d, -1);
  const prevDrawYmd = addYmdDays(lastDrawYmd.y, lastDrawYmd.m, lastDrawYmd.d, -1);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: { y: number; m: number; d: number }) => `${d.y}-${pad2(d.m)}-${pad2(d.d)}`;

  const d1 = fmt(lastDrawYmd);
  const d2 = fmt(prevDrawYmd);

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
    ``,
    `> LAST_WINNERS`,
`  #${d1}  winner   ${XPOT_SIGN}1,000,000`,
`  #${d2}  winner   ${XPOT_SIGN}1,000,000`,
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
    const sessBlockEnd = next.findIndex(l => l.trim().startsWith('> LAST_WINNERS'));
    const insertAt = Math.max(0, sessBlockEnd - 1);
    next.splice(insertAt, 0, line);

    while (next.length > 22) next.splice(insertAt, 1);
  }

  return next;
}

// BonusVault (unchanged)...
function BonusVault({
  children,
  spotlight = true,
}: {
  children: ReactNode;
  spotlight?: boolean;
}) {
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
    <div ref={ref} className="lg:sticky" style={{ top: stickyTop }}>
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
  const STORAGE_KEY = 'xpot_mission_hidden_day';
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const [hidden, setHidden] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const storedDay = localStorage.getItem(STORAGE_KEY);
      setHidden(storedDay === today);
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden === null || hidden) return null;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, today);
    } catch {}
    setHidden(true);
  }

  return (
    <div className="relative border-y border-slate-900/60 bg-slate-950/55 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_18%_20%,rgba(var(--xpot-gold),0.18),transparent_60%),radial-gradient(circle_at_82%_0%,rgba(56,189,248,0.16),transparent_62%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${GOLD_BORDER_SOFT} ${GOLD_BG_WASH} ${GOLD_RING_SHADOW}`}
            >
              <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
              Mission
            </span>

            <p className="text-[12px] text-slate-200">
              We’re aiming to become the <span className={GOLD_TEXT}>biggest game on the planet</span>.
              <span className="text-slate-400"> You’re early. This is where it starts.</span>
            </p>
          </div>

          <button
            onClick={dismiss}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-200 hover:bg-white/[0.06] transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function HomePageInner() {
  const bonusActive = useBonusActive();

  const [mint, setMint] = useState(XPOT_CA);
  useEffect(() => setMint(XPOT_CA), []);

  const { countdown, cutoffLabel, nowMs } = useNextDraw();
  const run = useMemo(() => calcRunProgress(new Date(nowMs)), [nowMs]);

  const runLine = useMemo(() => `DAY ${run.day}/${RUN_DAYS}`, [run.day]);

  const runEndDateOnly = useMemo(() => {
    // RUN_END_EU example: "22/02/2045 22:00 (Madrid)"
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

  // single meta effect (removed duplicate)
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
      <MissionBanner />

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
                  grid gap-6 p-6
                  lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.48fr)]
                  lg:p-8
                "
              >
                {/* LEFT */}
                <div className="flex flex-col justify-between gap-6 lg:pt-8">
                  <div className="space-y-6">
                    {/* HERO */}
                    <div className="relative p-2 sm:p-3">
                      <div className="pointer-events-none absolute -inset-28 opacity-85 blur-3xl bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.14),transparent_62%),radial-gradient(circle_at_82%_24%,rgba(56,189,248,0.11),transparent_62%),radial-gradient(circle_at_50%_0%,rgba(var(--xpot-gold),0.14),transparent_62%)]" />
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.55),rgba(255,255,255,0.10),rgba(16,185,129,0.26),transparent)]" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.16),rgba(var(--xpot-gold),0.22),transparent)] opacity-70" />

                      <div className="relative flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">
                          NO TICKETS · JUST XPOT HOLDINGS
                        </p>

                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.14)]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Holdings-based
                        </span>
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
                          <span className="mt-2 block text-slate-300">
                            We’re building toward becoming the world’s biggest game - one day at a time.
                          </span>
                        </p>
                      </div>

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

                          <span className="xpot-live-ring inline-flex items-center gap-2 rounded-full border border-emerald-400/18 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.14)]">
                            <Radio className="h-3.5 w-3.5 text-emerald-300/90" />
                            Live
                          </span>
                        </div>
                      </div>

                      <div className="relative mt-5 grid grid-cols-1 gap-4 2xl:grid-cols-2">
                        <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/25 p-5 ring-1 ring-white/[0.05]">
                          <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.12),transparent_62%),radial-gradient(circle_at_78%_30%,rgba(56,189,248,0.08),transparent_62%)]" />

                          <div className="relative flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Eligibility
                              </p>
                              <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
                                Hold XPOT in a connected wallet. Eligibility is verified on-chain in the hub.
                              </p>

                              <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-slate-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                                <span>Cutoff:</span>
                                <span className="text-slate-200">{cutoffLabel}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/35 p-5 ring-1 ring-white/[0.05]">
                          <div className="pointer-events-none absolute -inset-24 opacity-85 blur-3xl bg-[radial-gradient(circle_at_70%_20%,rgba(56,189,248,0.12),transparent_62%),radial-gradient(circle_at_30%_0%,rgba(var(--xpot-gold),0.18),transparent_62%)]" />

                          <div className="relative flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Final Draw
                              </p>

                              <p className="mt-2 text-[12px] text-slate-400">
                                Ends <span className="text-slate-200">{runEndDateOnly}</span>
                              </p>

                              <p className="mt-1 text-[12px] text-slate-400">
                                <span className="text-slate-200">{run.daysRemaining}</span> days remaining
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Run status</p>
                              <p className="mt-2 font-mono text-[14px] text-slate-50">
                                {run.day}/{RUN_DAYS}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {bonusActive ? (
                        <div className="mt-5">
                          <BonusVault>
                            <BonusStrip variant="home" />
                          </BonusVault>
                        </div>
                      ) : null}

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3.5 text-sm`} title="Enter the hub">
                          Enter the hub
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[28px] border border-slate-900/70 bg-slate-950/45 shadow-[0_26px_110px_rgba(0,0,0,0.42)] backdrop-blur">
                      <div className="pointer-events-none absolute -inset-28 opacity-85 blur-3xl bg-[radial-gradient(circle_at_12%_18%,rgba(var(--xpot-gold),0.18),transparent_62%),radial-gradient(circle_at_86%_22%,rgba(56,189,248,0.12),transparent_62%),radial-gradient(circle_at_70%_90%,rgba(16,185,129,0.10),transparent_62%)]" />
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.45),rgba(255,255,255,0.10),rgba(56,189,248,0.22),transparent)]" />

                      <div className="relative flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] shadow-[0_0_26px_rgba(var(--xpot-gold),0.16)]">
                            <ShieldCheck className={`h-4 w-4 ${GOLD_TEXT}`} />
                          </span>

                          <div className="leading-tight">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-100">
                              <span className={GOLD_TEXT}>Built as a daily reward protocol with an ending</span>
                            </p>

                            <p className="mt-1 text-[12px] text-slate-400">
                              Protocol distribution reserve
                              <span className="text-slate-700"> • </span>
                              payouts stay on-chain
                            </p>
                          </div>
                        </div>

                        <Link
                          href={ROUTE_TOKENOMICS_RESERVE}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={[
                            'group inline-flex items-center gap-2 rounded-full',
                            'border border-[rgba(var(--xpot-gold),0.55)] bg-[rgba(var(--xpot-gold),0.06)]',
                            'px-5 py-2.5 text-[13px] font-semibold text-slate-100',
                            'shadow-[0_18px_70px_rgba(var(--xpot-gold),0.14)]',
                            'hover:bg-white/[0.06] transition',
                          ].join(' ')}
                          title="View tokenomics"
                        >
                          <span>View tokenomics</span>
                          <ArrowRight className={`h-4 w-4 ${GOLD_TEXT} transition-transform group-hover:translate-x-0.5`} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Run day" value={`#${run.day}/${RUN_DAYS}`} tone="amber" />
                    <MiniStat label="Next cutoff" value={countdown} tone="emerald" />
                    <MiniStat label="Final draw" value={<FinalDrawDate variant="short" />} tone="violet" />
                  </div>

                  {/* ✅ MOVED LEFT: Contract + Trade cards (now sit under the left-side stats, like your screenshot vibe) */}
                  <div className="grid gap-4">
                    <PremiumCard className="p-5 sm:p-6" halo={false}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">Contract</p>
                          <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
                            Always verify the official mint before interacting.
                          </p>
                        </div>
                        <RoyalContractBar mint={mint} />
                      </div>
                    </PremiumCard>

                    <PremiumCard className="p-5 sm:p-6" halo={false}>
                      <TradeOnJupiterCard mint={mint} />
                    </PremiumCard>
                  </div>
                </div>

                {/* RIGHT */}
                <motion.div
                  className="grid gap-4"
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

          <div className="relative mt-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <Step
                n="01"
                title="Hold XPOT"
                desc="Eligibility is checked on-chain in the hub"
                icon={<ShieldCheck className="h-5 w-5 text-emerald-200" />}
                tone="emerald"
                tag="Eligibility"
              />
              <Step
                n="02"
                title="Link your X handle"
                desc="Handle-first identity for winners and history"
                icon={<Users className="h-5 w-5 text-sky-200" />}
                tone="sky"
                tag="Identity"
              />
              <Step
                n="03"
                title="Claim entry, verify payout"
                desc="Daily winners. On-chain proof. Finale ahead"
                icon={<Crown className={`h-5 w-5 ${GOLD_TEXT}`} />}
                tone="amber"
                tag="Proof"
              />
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

      {/* THE PROTOCOL STRIP */}
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

      {/* ECOSYSTEM LAYER */}
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
              <ul className="mt-4 space-y-2">
                <Bullet>Streak boosters</Bullet>
                <Bullet tone="sky">Creator-gated drops</Bullet>
                <Bullet tone="amber">Sponsor-funded pools</Bullet>
                <Bullet tone="violet">Milestone ladders</Bullet>
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
              <ul className="mt-4 space-y-2">
                <Bullet tone="sky">Winners shown by @handle</Bullet>
                <Bullet tone="violet">History can evolve into reputation</Bullet>
                <Bullet tone="emerald">Still self-custody for claims</Bullet>
              </ul>
            </div>

            <div className="rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-5">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${GOLD_BORDER_SOFT} ${GOLD_BG_WASH}`}
                >
                  <Crown className={`h-5 w-5 ${GOLD_TEXT}`} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">Finale</p>
                  <p className="text-xs text-slate-400">A run that ends</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                <Bullet tone="amber">
                  Final draw: <FinalDrawDate variant="short" />
                </Bullet>
                <Bullet tone="emerald">Daily cadence builds the arc</Bullet>
                <Bullet tone="sky">Proof stays public</Bullet>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-slate-900/70 bg-slate-950/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <p className="text-sm text-slate-300">Clarity first. Proof first. Ending-first narrative.</p>
            </div>

            <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-5 py-2.5 text-sm`}>
              Claim your entry
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </PremiumCard>
      </section>

      {/* WHO IT'S FOR */}
      <section className="mt-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="amber">
              <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
              Players
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">A serious run for serious entries.</p>
            <p className="mt-2 text-sm text-slate-300">Join the arc. Track the day count. Build toward the Final Draw.</p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="sky">
              <Globe className="h-3.5 w-3.5" />
              Sponsors
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">Fund moments, not ads.</p>
            <p className="mt-2 text-sm text-slate-300">
              Sponsor pools and bonuses with visibility and provable distribution on-chain.
            </p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="emerald">
              <Zap className="h-3.5 w-3.5" />
              Communities
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">Portable loyalty.</p>
            <p className="mt-2 text-sm text-slate-300">A shared public story: @handle identity and an arc that ends.</p>
          </PremiumCard>
        </div>
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

          <div className="mt-6">
            <Accordion items={faq} />
          </div>
        </PremiumCard>
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
