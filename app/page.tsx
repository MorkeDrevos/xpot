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
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Blocks,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Crown,
  ExternalLink,
  Globe,
  Lock,
  ShieldCheck,
  Sparkles,
  Stars,
  Users,
  Wand2,
  Zap,
  Timer,
  Info,
  Radio,
  Flame,
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';
import XpotFooter from '@/components/XpotFooter';
import { createPortal } from 'react-dom';

const ROUTE_HUB = '/hub';
const ROUTE_OPS = '/ops';
const ROUTE_TERMS = '/terms';
const ROUTE_TOKENOMICS = '/tokenomics';
const ROUTE_TOKENOMICS_RESERVE = '/tokenomics?tab=rewards&focus=reserve';

const XPOT_CA =
  process.env.NEXT_PUBLIC_XPOT_MINT ||
  process.env.NEXT_PUBLIC_XPOT_CA ||
  'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1';

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

// ─────────────────────────────────────────────
// FINAL DRAW SEASON (7000-day campaign)
// - Day 1 begins 2025-12-25 (Madrid)
// - Day 7000 is 2045-02-22 (Madrid)
// ─────────────────────────────────────────────

const SEASON_DAYS = 7000;
const SEASON_START = { y: 2025, m: 12, d: 25 }; // Madrid wall-clock start
const SEASON_END = { y: 2045, m: 2, d: 22 }; // Day 7000 (Madrid)

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

  const nextDrawUtcMs = useMemo(
    () => getNextMadridCutoffUtcMs(22, new Date(nowMs)),
    [nowMs],
  );

  const countdown = useMemo(
    () => formatCountdown(nextDrawUtcMs - nowMs),
    [nextDrawUtcMs, nowMs],
  );

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

function getJupiterSwapUrl(mint: string) {
  return `https://jup.ag/swap/SOL-${mint}`;
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

function PrinciplesStrip() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        {
          k: 'The Final Draw',
          v: '7000-day season',
          s: 'A single global arc, not a one-week promo',
          glow: 'bg-[radial-gradient(circle_at_0%_0%,rgba(var(--xpot-gold),0.12),transparent_62%)]',
        },
        {
          k: 'Identity',
          v: '@handle-first',
          s: 'Winners shown by handle, not wallet profiles',
          glow: 'bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.10),transparent_64%)]',
        },
        {
          k: 'Proof',
          v: 'On-chain payouts',
          s: 'Verify distributions in an explorer',
          glow: 'bg-[radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.10),transparent_64%)]',
        },
      ].map(it => (
        <div
          key={it.k}
          className="relative overflow-hidden rounded-2xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.05]"
        >
          <div className={`pointer-events-none absolute -inset-24 opacity-80 blur-3xl ${it.glow}`} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{it.k}</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{it.v}</p>
          <p className="mt-1 text-[12px] text-slate-400">{it.s}</p>
        </div>
      ))}
    </div>
  );
}

function SectionDividerLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">{label}</span>
      <span className="h-px flex-1 bg-white/10" />
      <span className="hidden sm:inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-600">
        <span className="h-1 w-1 rounded-full bg-white/20" />
        <span>Season</span>
        <span className="h-1 w-1 rounded-full bg-white/20" />
        <span>Identity</span>
        <span className="h-1 w-1 rounded-full bg-white/20" />
        <span>Proof</span>
      </span>
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
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Step {n}
        </span>

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
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
   Countdown (Madrid draw cutoff) + Madrid date helpers
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

function getMadridMidnightUtcMs(yy: number, mm: number, dd: number, now = new Date()) {
  const offsetMs = getMadridOffsetMs(now);
  const asUtc = Date.UTC(yy, mm - 1, dd, 0, 0, 0);
  return asUtc - offsetMs;
}

function calcSeasonProgress(now = new Date()) {
  const p = getMadridParts(now);

  const todayMidUtc = getMadridMidnightUtcMs(p.y, p.m, p.d, now);
  const startMidUtc = getMadridMidnightUtcMs(SEASON_START.y, SEASON_START.m, SEASON_START.d, now);
  const endMidUtc = getMadridMidnightUtcMs(SEASON_END.y, SEASON_END.m, SEASON_END.d, now);

  const dayIndex = Math.floor((todayMidUtc - startMidUtc) / 86_400_000) + 1; // Day 1 on start date
  const day = Math.max(0, Math.min(SEASON_DAYS, dayIndex));

  const daysRemaining = Math.max(0, Math.floor((endMidUtc - todayMidUtc) / 86_400_000));
  const started = todayMidUtc >= startMidUtc;
  const ended = todayMidUtc > endMidUtc;

  return { day, daysRemaining, started, ended };
}

function getNextMadridCutoffUtcMs(cutoffHour = 22, now = new Date()) {
  const p = getMadridParts(now);
  const offsetMs = getMadridOffsetMs(now);

  const mkUtcFromMadridWallClock = (
    yy: number,
    mm: number,
    dd: number,
    hh: number,
    mi: number,
    ss: number,
  ) => {
    const asUtc = Date.UTC(yy, mm - 1, dd, hh, mi, ss);
    return asUtc - offsetMs;
  };

  let targetUtc = mkUtcFromMadridWallClock(p.y, p.m, p.d, cutoffHour, 0, 0);

  if (now.getTime() >= targetUtc) {
    const base = new Date(Date.UTC(p.y, p.m - 1, p.d, 0, 0, 0));
    base.setUTCDate(base.getUTCDate() + 1);
    const yy = base.getUTCFullYear();
    const mm = base.getUTCMonth() + 1;
    const dd = base.getUTCDate();
    targetUtc = mkUtcFromMadridWallClock(yy, mm, dd, cutoffHour, 0, 0);
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

/* Bonus visibility:
   - We hide the entire block until an API reports "active".
   - If the endpoint fails, we keep it hidden (safe default for pre-launch). */
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

/* ─────────────────────────────────────────────
   Reduced motion hook (local)
───────────────────────────────────────────── */

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
   Confirmed: Keep "Final Draw" as lore, but the panel is the main character.
───────────────────────────────────────────── */

function LiveControlRoom({
  countdown,
  cutoffLabel,
  seasonLine,
}: {
  countdown: string;
  cutoffLabel: string;
  seasonLine: string;
}) {
  const reduced = useLocalReducedMotion();
  const [tick, setTick] = useState(0);
  const [lines, setLines] = useState<string[]>(() =>
    buildInitialLines(countdown, cutoffLabel, seasonLine),
  );

  useEffect(() => {
    const t = window.setInterval(() => setTick(v => v + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setLines(prev => updateLines(prev, tick, countdown, cutoffLabel, seasonLine));
  }, [tick, countdown, cutoffLabel, seasonLine]);

  const live = true;
  const pulseCls = reduced ? '' : 'animate-[xpotPulse_2.6s_ease-in-out_infinite]';
  const scanCls = reduced ? '' : 'xpot-cr-scan';

  return (
    <div className="relative">
      <style jsx global>{`
        @keyframes xpotPulse {
          0% { transform: translateZ(0) scale(1); opacity: 0.85; }
          50% { transform: translateZ(0) scale(1.02); opacity: 1; }
          100% { transform: translateZ(0) scale(1); opacity: 0.85; }
        }
        @keyframes xpotScan {
          0% { transform: translateY(-18%); opacity: 0.0; }
          18% { opacity: 0.22; }
          55% { opacity: 0.10; }
          100% { transform: translateY(118%); opacity: 0.0; }
        }
        @keyframes xpotFlicker {
          0% { opacity: 0.35; }
          50% { opacity: 0.75; }
          100% { opacity: 0.35; }
        }
        .xpot-cr-scan {
          position: relative;
          isolation: isolate;
        }
        .xpot-cr-scan::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: 18px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(16,185,129,0.10),
            rgba(56,189,248,0.07),
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
          margin-left: 4px;
          background: rgba(16,185,129,0.75);
          box-shadow: 0 0 16px rgba(52,211,153,0.6);
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
        className={`relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.9)] ${scanCls}`}
      >
        <div className="pointer-events-none absolute -inset-20 opacity-65 blur-3xl bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(circle_at_88%_30%,rgba(56,189,248,0.12),transparent_65%)]" />

        <pre className="relative z-10 max-h-56 overflow-hidden font-mono text-[11px] leading-relaxed text-emerald-100/90">
          {lines.join('\n')}
        </pre>

        <div className="relative z-10 mt-2 text-[11px] text-emerald-200/70">
          Live cockpit feed - updates every second
          <span className="xpot-cr-cursor" />
        </div>
      </div>

      <p className="mt-3 text-[12px] text-slate-400">
        Read-only cockpit view. Season is public. Identity stays handle-first. Proof stays on-chain.
      </p>
    </div>
  );
}

function buildInitialLines(countdown: string, cutoffLabel: string, seasonLine: string) {
  return [
    `> XPOT_PROTOCOL`,
    `  season:         ${seasonLine}`,
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
    `  status:         season telemetry`,
    ``,
    `> LAST_WINNERS`,
    `  #2025-12-18  winner   ${XPOT_SIGN}1,000,000`,
    `  #2025-12-18  bonus    ${XPOT_SIGN}250,000`,
    `  #2025-12-17  winner   ${XPOT_SIGN}1,000,000`,
  ];
}

function updateLines(
  prev: string[],
  tick: number,
  countdown: string,
  cutoffLabel: string,
  seasonLine: string,
) {
  const next = [...prev];

  const seasonIdx = next.findIndex(l => l.trim().startsWith('season:'));
  if (seasonIdx !== -1) next[seasonIdx] = `  season:         ${seasonLine}`;

  const idx = next.findIndex(l => l.trim().startsWith('in:'));
  if (idx !== -1) next[idx] = `  in:             ${countdown}  (${cutoffLabel})`;

  const hbIdx = next.findIndex(l => l.trim().startsWith('heartbeat:'));
  if (hbIdx !== -1) next[hbIdx] = `  heartbeat:      ${tick % 9 === 0 ? 'sync' : 'ok'}`;

  const stIdx = next.findIndex(l => l.trim().startsWith('status:'));
  if (stIdx !== -1) {
    const modes = ['season telemetry', 'proof verify', 'pool telemetry', 'entry window open'];
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

function BonusVault({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-10 opacity-70 blur-2xl bg-[radial-gradient(circle_at_22%_38%,rgba(16,185,129,0.20),transparent_64%),radial-gradient(circle_at_72%_30%,rgba(56,189,248,0.12),transparent_64%),radial-gradient(circle_at_85%_80%,rgba(var(--xpot-gold),0.10),transparent_66%)]" />

      <div className="relative overflow-hidden rounded-[28px] bg-white/[0.03] ring-1 ring-white/[0.06] shadow-[0_30px_110px_rgba(0,0,0,0.45)]">
        <div className="xpot-bonus-sheen" />

        <div className="relative p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/90">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-emerald-400/60 animate-ping" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              </span>
              Bonus XPOT active
            </span>

            <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200 ring-1 ring-white/10">
              Same entry
              <span className="h-1 w-1 rounded-full bg-white/20" />
              Paid on-chain
            </span>
          </div>

          <div className="relative">{children}</div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-slate-400">Scheduled bonus drop. Appears automatically when active.</p>

            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200 ring-1 ring-emerald-400/15">
              <Sparkles className="h-3.5 w-3.5" />
              Vault reveal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinalDrawBanner({
  day,
  daysRemaining,
  started,
  ended,
}: {
  day: number;
  daysRemaining: number;
  started: boolean;
  ended: boolean;
}) {
  const title = ended ? 'THE FINAL DRAW HAS ARRIVED' : 'THE FINAL DRAW SEASON';
  const sub = ended
    ? 'Season complete. The finale is live.'
    : started
    ? 'A 7000-day global game. One arc. One legend.'
    : 'Season starts on 2025-12-25 (Madrid).';

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/[0.06] shadow-[0_22px_90px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute -inset-24 opacity-75 blur-3xl bg-[radial-gradient(circle_at_10%_30%,rgba(var(--xpot-gold),0.22),transparent_60%),radial-gradient(circle_at_88%_22%,rgba(236,72,153,0.12),transparent_62%),radial-gradient(circle_at_70%_90%,rgba(56,189,248,0.10),transparent_62%)]" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="amber">
              <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
              {title}
            </Pill>
            <Pill tone="violet">
              <Flame className="h-3.5 w-3.5" />
              Day {day}/{SEASON_DAYS}
            </Pill>
            <Pill tone="sky">
              <Timer className="h-3.5 w-3.5" />
              {daysRemaining} days remaining
            </Pill>
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-100">{sub}</p>
          <p className="mt-1 text-[12px] text-slate-400">
            Final day: <span className="text-slate-200">2045-02-22</span> (Madrid) • Eligibility is holdings-based • Winners are
            shown by <span className="text-slate-200">@handle</span> and paid on-chain
          </p>
        </div>

        <Link
          href={ROUTE_HUB}
          className={`${BTN_GREEN} group px-5 py-2.5 text-sm`}
          title="Enter via the hub"
        >
          Enter now
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function HomePageInner() {
  const bonusActive = useBonusActive();

  const [mint, setMint] = useState(XPOT_CA);
  useEffect(() => setMint(XPOT_CA), []);

  const { countdown, cutoffLabel, nowMs } = useNextDraw();

  const season = useMemo(() => calcSeasonProgress(new Date(nowMs)), [nowMs]);
  const seasonLine = useMemo(() => `DAY ${season.day}/${SEASON_DAYS}  (final: 2045-02-22)`, [season.day]);

  const faq = useMemo(
    () => [
      {
        q: 'What is “The Final Draw” exactly?',
        a: 'It’s the season finale of a 7000-day global XPOT campaign. Daily entries happen through the hub, and the entire season culminates in the Final Draw.',
      },
      {
        q: 'Do I need tickets to enter?',
        a: 'No tickets. Eligibility is holdings-based. Hold XPOT, verify eligibility in the hub and claim your entry.',
      },
      {
        q: 'Why do winners show as @handle?',
        a: 'XPOT is handle-first: winners and history are presented by X handle for a clean public layer, while claims remain self-custody and wallet-native.',
      },
      {
        q: 'How can anyone verify payouts?',
        a: 'Payouts are on-chain. Proof is the product. Anyone can verify distributions in an explorer.',
      },
    ],
    [],
  );

  const hero = (
    <section className="relative">
      <div aria-hidden className="h-[calc(var(--xpot-banner-h,56px)+var(--xpot-topbar-h,112px)+14px)]" />

      <div className="relative overflow-hidden border-y border-slate-900/60 bg-slate-950/20 shadow-[0_60px_220px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.55))]" />

        <div className="relative z-10 w-full px-0">
          <div className="py-5 sm:py-7">
            <div className="relative w-full overflow-hidden rounded-[38px] border border-slate-900/70 bg-slate-950/35 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.45),rgba(255,255,255,0.08),rgba(56,189,248,0.25),transparent)]" />

              <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:p-8">
                {/* LEFT */}
                <div className="flex flex-col justify-between gap-5">
                  <div className="space-y-5">
                    <FinalDrawBanner
                      day={season.day}
                      daysRemaining={season.daysRemaining}
                      started={season.started}
                      ended={season.ended}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="emerald">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                        On-chain proof
                      </Pill>

                      <Pill tone="sky">
                        <Users className="h-3.5 w-3.5" />
                        X handle required
                      </Pill>

                      <Pill tone="violet">
                        <Timer className="h-3.5 w-3.5" />
                        Next draw {countdown}
                      </Pill>
                    </div>

                    <div className="rounded-[28px] bg-white/[0.022] p-6 ring-1 ring-white/[0.055] sm:p-7 lg:p-8">
                      <div className="mt-4">
                        <h1 className="text-balance text-[40px] font-semibold leading-[1.05] sm:text-[56px]">
  One protocol. One identity.
  <br />
  <span className="text-emerald-300">One daily XPOT draw.</span>
</h1>

<p className="mt-3 text-[13px] leading-relaxed text-slate-400">
  Daily draws are the heartbeat. The Final Draw is the season ending -
  <span className="text-slate-200"> 2044-02-22 (Madrid)</span>.
</p>
                      </div>

                      <div className="mt-5">
                        <SectionDividerLabel label="What you need" />
                      </div>

                      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-300/95">
                        XPOT is simple on purpose: daily reward selection, handle-first identity and on-chain proof.
                        Connect your <span className="text-slate-100">X account</span>, connect a{' '}
                        <span className="text-slate-100">wallet</span> and hold the minimum threshold to qualify.
                        Winners are presented by <span className="text-slate-100">@handle</span> and paid on-chain.
                      </p>

                      <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                              Eligibility (launch rule)
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-100">
                              Hold at least <span className={`${GOLD_TEXT}`}>$100,000</span> worth of XPOT
                            </p>
                            <p className="mt-1 text-[12px] text-slate-400">
                              Entry is claim-based in the hub. No tickets. No checkout.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <Pill tone="amber">
                              <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
                              THE FINAL DRAW
                            </Pill>

                            <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                              Day {season.day} of {SEASON_DAYS}
                            </span>
                          </div>
                        </div>
                      </div>

                      {bonusActive ? (
                        <div className="mt-6">
                          <BonusVault>
                            <BonusStrip variant="home" />
                          </BonusVault>
                        </div>
                      ) : null}

                      <div className="mt-6 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />

                      <div className="mt-6 relative overflow-hidden rounded-[22px] border border-slate-900/70 bg-slate-950/45 px-5 py-4 shadow-[0_22px_80px_rgba(0,0,0,0.38)] backdrop-blur">
                        <div
                          className="
                            pointer-events-none absolute -inset-24 opacity-70 blur-3xl
                            bg-[radial-gradient(circle_at_18%_30%,rgba(var(--xpot-gold),0.22),transparent_60%),
                                radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.06),transparent_62%)]
                          "
                        />

                        <div className="relative flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`
                                inline-flex h-9 w-9 items-center justify-center rounded-full
                                border ${GOLD_BORDER_SOFT} ${GOLD_BG_WASH}
                                shadow-[0_0_22px_rgba(var(--xpot-gold),0.16)]
                              `}
                            >
                              <ShieldCheck className={`h-4 w-4 ${GOLD_TEXT}`} />
                            </span>

                            <div className="leading-tight">
                              <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${GOLD_TEXT}`}>
                                SEASON ARCHITECTURE - BUILT FOR A LONG RUNWAY
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400/80">
                                Reserve-backed distribution • Proof stays on-chain
                                <span className="text-slate-700"> • </span>
                                <span className="text-slate-600">{cutoffLabel}</span>
                              </p>
                            </div>
                          </div>

                          <Link
                            href={ROUTE_TOKENOMICS_RESERVE}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${BTN_PRIMARY} group px-5 py-2.5 text-sm`}
                            title="Open Tokenomics (Rewards reserve)"
                          >
                            View tokenomics
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </div>
                      </div>

                      <div className="mt-6">
                        <PrinciplesStrip />
                      </div>

                      <div className="mt-6">
                        <RoyalContractBar mint={mint} />
                      </div>

                      {/* FIXED BUTTONS (this was breaking build) */}
                      <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Link
                          href={ROUTE_HUB}
                          className={`${BTN_GREEN} group px-6 py-3.5 text-sm`}
                          title="Enter the hub"
                        >
                          Enter the hub
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>

                        <Link
                          href={ROUTE_HUB}
                          className="
                            inline-flex items-center justify-center rounded-full
                            border border-white/10 bg-white/[0.03] px-6 py-3.5
                            text-sm font-semibold text-slate-100
                            shadow-[0_18px_60px_rgba(0,0,0,0.35)]
                            hover:bg-white/[0.06] transition
                          "
                          title="Learn how entry works in the hub"
                        >
                          See eligibility
                          <Info className="ml-2 h-4 w-4 text-slate-300" />
                        </Link>
                      </div>

                      <p className="mt-4 text-[11px] text-slate-500/95">
                        Daily draws are the heartbeat. The Final Draw is the season ending. Winners are shown by @handle and paid on-chain.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Season day" value={`#${season.day}/${SEASON_DAYS}`} tone="amber" />
                    <MiniStat label="Next cutoff" value={countdown} tone="emerald" />
                    <MiniStat label="Final date" value="2045-02-22" tone="violet" />
                  </div>
                </div>

                {/* RIGHT - main character */}
                <div className="grid gap-4">
                  <PremiumCard className="p-5 sm:p-6" halo sheen>
                    <div className="mt-0">
                      <JackpotPanel variant="standalone" layout="wide" />
                    </div>
                  </PremiumCard>

                  <PremiumCard className="p-5 sm:p-6" halo={false}>
                    <LiveControlRoom countdown={countdown} cutoffLabel={cutoffLabel} seasonLine={seasonLine} />
                  </PremiumCard>
                </div>
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
                Daily draws with proof. One season ending with a finale.
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
                desc="Daily winners. On-chain proof. Season finale ahead"
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
                Built for serious players: clean rules, public season arc and provable outcomes.
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
              Finale (season ending)
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">The Final Draw is the season ending.</p>
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
            <p className="mt-2 text-sm text-slate-300">Anyone can verify payouts in an explorer.</p>
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
                A season engine with a finale, not a one-off giveaway.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                XPOT stays minimal where it matters and expandable where it counts.
                The season can grow with modules and sponsor pools, while keeping the same primitive and the same proof.
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
                <Bullet>Season streak boosters</Bullet>
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
                  <p className="text-xs text-slate-400">A season that ends</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                <Bullet tone="amber">Day 7000 finale: 2045-02-22</Bullet>
                <Bullet tone="emerald">Daily cadence builds the arc</Bullet>
                <Bullet tone="sky">Proof stays public</Bullet>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-slate-900/70 bg-slate-950/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <p className="text-sm text-slate-300">Clarity first. Proof first. Season-first narrative.</p>
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
            <p className="mt-3 text-lg font-semibold text-slate-50">A serious season for serious entries.</p>
            <p className="mt-2 text-sm text-slate-300">Join the arc. Track the day count. Build toward the Final Draw.</p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="sky">
              <Globe className="h-3.5 w-3.5" />
              Sponsors
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">Fund moments, not ads.</p>
            <p className="mt-2 text-sm text-slate-300">Sponsor pools and bonuses with visibility and provable distribution on-chain.</p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="emerald">
              <Zap className="h-3.5 w-3.5" />
              Communities
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">Portable loyalty.</p>
            <p className="mt-2 text-sm text-slate-300">A shared public story: @handle identity and a season that ends.</p>
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
