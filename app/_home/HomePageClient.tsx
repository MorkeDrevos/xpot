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
import { useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Crown,
  ExternalLink,
  Globe,
  Info,
  Radio,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  Wand2,
  Zap,
  Copy,
  Check,
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';
import XpotFooter from '@/components/XpotFooter';
import FinalDrawDate from '@/components/FinalDrawDate';
import RotatingAnnouncement from '@/components/RotatingAnnouncement';

import LiveActivityModule, {
  type LiveWinnerRow,
  type EntryRow,
} from '@/components/LiveActivityModule';

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

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.45)] hover:bg-emerald-300 transition';

const GOLD_TEXT = 'text-[rgb(var(--xpot-gold-2))]';
const GOLD_TEXT_DIM = 'text-[rgba(var(--xpot-gold-2),0.85)]';
const GOLD_BORDER = 'border-[rgba(var(--xpot-gold),0.35)]';
const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
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

function shortenAddress(addr: string, left = 6, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

function normalizeHandle(h: string | null | undefined) {
  const s = String(h ?? '').trim();
  if (!s) return '@unknown';
  return s.startsWith('@') ? s : `@${s}`;
}

function toXProfileUrl(handle: string | null | undefined) {
  const h = normalizeHandle(handle).replace(/^@/, '');
  return `https://x.com/${encodeURIComponent(h)}`;
}

function formatNumber(n: number) {
  return n.toLocaleString();
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

        @keyframes xpotMicroGlow {
          0% {
            opacity: 0.35;
            transform: translateY(0);
          }
          50% {
            opacity: 0.55;
            transform: translateY(-1px);
          }
          100% {
            opacity: 0.35;
            transform: translateY(0);
          }
        }
        .xpot-micro-glow {
          animation: xpotMicroGlow 2.9s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .xpot-micro-glow {
            animation: none;
          }
        }
      `}</style>

      <div className="xpot-hero-engine" aria-hidden />
      <div className="xpot-hero-sheen" aria-hidden />
      <div className="xpot-hero-grain" aria-hidden />
      <div className="xpot-console-sweep" aria-hidden />
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

/**
 * ✅ Home page uses the SAME canonical source as /winners page first:
 *    GET /api/winners/recent?limit=1
 */
function useLatestWinnerCard() {
  const [winner, setWinner] = useState<LiveWinnerRow | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      const data = await fetchFirstOk<any>([
        '/api/winners/recent?limit=1',
        '/api/public/winners/latest',
        '/api/public/winners?latest=1',
        '/api/public/winners?limit=1',
        '/api/public/winners',
      ]);

      if (!alive) return;

      let w: any = null;

      if (data && Array.isArray(data?.winners) && data.winners[0]) {
        const x = data.winners[0];

        const safeId =
          x?.id ??
          x?.winnerId ??
          x?.txSig ??
          x?.txHash ??
          (x?.drawDate ? `win_${String(x.drawDate)}` : 'latest');

        w = {
          id: String(safeId),
          handle: x.handle ?? x.xHandle ?? null,
          name: x.name ?? x.xName ?? null,
          avatarUrl: x.avatarUrl ?? x.xAvatarUrl ?? null,
          wallet: x.wallet ?? x.walletAddress ?? x.walletAddr ?? null,
          amountXpot:
            typeof x.amountXpot === 'number'
              ? x.amountXpot
              : typeof x.amount === 'number'
                ? x.amount
                : null,
          amount: typeof x.amount === 'number' ? x.amount : null,
          drawDate: x.drawDate ?? x.date ?? x.createdAt ?? null,
          txUrl: x.txUrl ?? x.txLink ?? null,
          isPaidOut: typeof x.isPaidOut === 'boolean' ? x.isPaidOut : Boolean(x.txUrl ?? x.txLink),
          kind: (x.kind ?? x.winnerKind ?? x.type ?? null) as any,
          label: x.label ?? null,
        };
      } else if (data?.ok === true && data?.winner) {
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
        const x = data.winners[0] as LiveWinnerRow;
        w = { ...x, id: String((x as any).id ?? (x.drawDate ? `win_${x.drawDate}` : 'latest')) };
      } else if (Array.isArray(data) && data[0]) {
        const x = data[0] as LiveWinnerRow;
        w = { ...x, id: String((x as any).id ?? (x.drawDate ? `win_${x.drawDate}` : 'latest')) };
      }

      setWinner(w && w.id ? (w as LiveWinnerRow) : null);
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
   Phase helpers
───────────────────────────────────────────── */

function useDrawPhase(nowMs: number, nextDrawUtcMs: number) {
  const msLeft = nextDrawUtcMs - nowMs;
  const warmup = msLeft > 0 && msLeft <= 2 * 60 * 60 * 1000;
  return { msLeft, warmup };
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
   Page building blocks (new)
───────────────────────────────────────────── */

function SectionHeader({
  eyebrow,
  title,
  desc,
  right,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-pretty text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">{title}</h2>
        {desc ? <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-slate-400">{desc}</p> : null}
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function MetricChip({
  label,
  value,
  tone = 'slate',
  icon,
}: {
  label: string;
  value: ReactNode;
  tone?: 'slate' | 'emerald' | 'sky' | 'amber' | 'violet';
  icon?: ReactNode;
}) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
      : tone === 'sky'
        ? 'border-sky-400/20 bg-sky-500/10 text-sky-100'
        : tone === 'amber'
          ? 'border-[rgba(var(--xpot-gold),0.22)] bg-[rgba(var(--xpot-gold),0.10)] text-slate-100'
          : tone === 'violet'
            ? 'border-violet-400/20 bg-violet-500/10 text-violet-100'
            : 'border-white/10 bg-white/[0.03] text-slate-200';

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${toneClass} px-4 py-3 ring-1 ring-white/[0.05]`}>
      <div className="pointer-events-none absolute -inset-20 opacity-70 blur-3xl bg-[radial-gradient(circle_at_18%_30%,rgba(255,255,255,0.06),transparent_62%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.10),transparent_62%),radial-gradient(circle_at_40%_0%,rgba(var(--xpot-gold),0.08),transparent_62%)]" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] opacity-80">{label}</p>
          <div className="mt-1 text-[13px] font-semibold text-slate-50">{value}</div>
        </div>
        {icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/30">
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function PrimaryCtaRow({ countdown, warmup }: { countdown: string; warmup: boolean }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <Link
        href={ROUTE_HUB}
        className={`${BTN_GREEN} group px-6 py-3.5 text-sm ${warmup ? 'xpot-warmup-ring' : ''}`}
        title="Open the hub"
      >
        Claim today&apos;s entry
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

function CopyMintRow() {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(XPOT_CA);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/35 px-4 py-2 text-[12px] text-slate-200 ring-1 ring-white/[0.05]">
        <span className="text-slate-400">Mint</span>
        <span className="font-mono">{shortenAddress(XPOT_CA, 10, 10)}</span>
      </div>

      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-200" /> : <Copy className="h-4 w-4 text-slate-300" />}
        {copied ? 'Copied' : 'Copy mint'}
      </button>
    </div>
  );
}

function WinnerMiniCard({ winner }: { winner: LiveWinnerRow | null }) {
  const handle = winner?.handle ? normalizeHandle(winner.handle) : null;
  const xUrl = handle ? toXProfileUrl(handle) : null;

  const amount = typeof winner?.amountXpot === 'number' ? winner.amountXpot : typeof winner?.amount === 'number' ? winner.amount : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/25 p-5 ring-1 ring-white/[0.05]">
      <div className="pointer-events-none absolute -inset-24 opacity-75 blur-3xl bg-[radial-gradient(circle_at_14%_25%,rgba(var(--xpot-gold),0.14),transparent_62%),radial-gradient(circle_at_80%_25%,rgba(56,189,248,0.10),transparent_62%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Winner just took home
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                {winner?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={winner.avatarUrl}
                    alt={handle ? `${handle} avatar` : 'Winner avatar'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Crown className={`h-5 w-5 ${GOLD_TEXT}`} />
                )}
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {handle ? (
                    <a
                      href={xUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-[14px] font-semibold text-slate-50 hover:text-white transition"
                      title="Open X profile"
                    >
                      {handle}
                    </a>
                  ) : (
                    <span className="truncate text-[14px] font-semibold text-slate-50">Pending</span>
                  )}

                  {winner?.kind ? (
                    <Pill tone={winner.kind === 'BONUS' ? 'violet' : 'amber'}>
                      <Sparkles className="h-3.5 w-3.5" />
                      {winner.kind === 'BONUS' ? 'Bonus' : 'Main'}
                    </Pill>
                  ) : null}
                </div>

                <div className="mt-1 text-[12px] text-slate-400">
                  {winner?.txUrl ? (
                    <a
                      href={winner.txUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition"
                    >
                      On-chain proof
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    </a>
                  ) : (
                    <span>Proof appears after payout</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grow" />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.05]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Payout</div>
              <div className={`mt-1 text-[16px] font-semibold ${GOLD_TEXT}`}>
                {amount ? `${formatNumber(amount)} XPOT` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepRail() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 ring-1 ring-white/[0.06]">
        <div className="pointer-events-none absolute -inset-24 opacity-75 blur-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.22),transparent_62%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.10),transparent_62%)]" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-100/80">Step 1</p>
          <div className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-slate-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-200" />
            Hold {formatNumber(MIN_ELIGIBLE_XPOT)} XPOT
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-emerald-100/75">In your connected wallet.</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-sky-400/20 bg-sky-500/10 p-5 ring-1 ring-white/[0.06]">
        <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.20),transparent_62%),radial-gradient(circle_at_82%_30%,rgba(16,185,129,0.10),transparent_62%)]" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-100/85">Step 2</p>
          <div className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-slate-50">
            <Wand2 className="h-4 w-4 text-sky-200" />
            Claim daily entry in hub
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-sky-100/75">X + wallet verification.</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[rgba(var(--xpot-gold),0.22)] bg-[rgba(var(--xpot-gold),0.10)] p-5 ring-1 ring-white/[0.06]">
        <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(var(--xpot-gold),0.18),transparent_62%),radial-gradient(circle_at_82%_30%,rgba(56,189,248,0.10),transparent_62%)]" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-100/85">Step 3</p>
          <div className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-slate-50">
            <ShieldCheck className={`h-4 w-4 ${GOLD_TEXT}`} />
            Winner + proof at 22:00 Madrid
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-200/80">On-chain payout link shown.</p>
        </div>
      </div>
    </div>
  );
}

function FAQItem({
  q,
  a,
  defaultOpen = false,
}: {
  q: string;
  a: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] ring-1 ring-white/[0.05]">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-[14px] font-semibold text-slate-50">{q}</span>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="px-6 pb-6">
          <div className="h-px bg-white/10" />
          <div className="pt-4 text-[12px] leading-relaxed text-slate-400">{a}</div>
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Home page (redesigned)
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
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.06),rgba(0,0,0,0.70))]" />

        <div className="relative z-10 mx-auto w-full max-w-none px-3 sm:px-6 lg:px-10 2xl:px-14">
          <div className="py-5 sm:py-7">
            <div className="relative w-full overflow-hidden rounded-[40px] border border-slate-900/70 bg-slate-950/35 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <CosmicHeroBackdrop />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.55),rgba(255,255,255,0.10),rgba(56,189,248,0.30),transparent)]" />

              {/* New layout: RIGHT (Jackpot) dominates */}
              <div className="relative z-10 grid gap-5 p-4 sm:p-6 lg:p-8 lg:items-start lg:grid-cols-[minmax(0,1.28fr)_minmax(0,0.72fr)] 2xl:grid-cols-[minmax(0,1.36fr)_minmax(0,0.64fr)]">
                {/* RIGHT - Jackpot hero */}
                <div className="min-w-0 order-1 lg:order-2">
                  <div className="relative -mt-1 lg:-mt-2">
                    <JackpotPanel variant="standalone" layout="wide" mode="hero" />
                  </div>

                  {bonusActive ? (
                    <div className="mt-4">
                      <PremiumCard className="p-5 sm:p-6" halo={false}>
                        <BonusStrip />
                      </PremiumCard>
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-3">
                    <MetricChip
                      label="Cadence"
                      value={
                        <span className="inline-flex items-center gap-2">
                          <span className="font-mono text-slate-100">{countdown}</span>
                          <span className="text-slate-400">to cutoff</span>
                        </span>
                      }
                      tone={warmup ? 'amber' : 'sky'}
                      icon={<Timer className="h-4 w-4 text-slate-200" />}
                    />
                    <MetricChip
                      label="Eligibility"
                      value={
                        <span className="inline-flex items-center gap-2">
                          <span className="font-mono text-slate-100">{formatNumber(MIN_ELIGIBLE_XPOT)}</span>
                          <span className="text-slate-400">XPOT minimum</span>
                        </span>
                      }
                      tone="emerald"
                      icon={<BadgeCheck className="h-4 w-4 text-emerald-200" />}
                    />
                  </div>
                </div>

                {/* LEFT - Identity + proof + winner spotlight */}
                <div className="min-w-0 order-2 lg:order-1">
                  <div className="relative">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Pill tone={warmup ? 'amber' : 'emerald'}>
                        <Radio className="h-3.5 w-3.5" />
                        {run.ended ? 'Final draw' : warmup ? 'Warm-up' : run.started ? 'Live run' : 'Pre-run'}
                      </Pill>

                      <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">
                        Handle-first identity + on-chain proof
                      </span>
                    </div>

                    <div className="mt-4">
                      <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                        The daily <span className="xpot-xpotword">XPOT</span> moment.
                      </h1>

                      <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-slate-300">
                        Hold XPOT to qualify. Claim entry each day in the hub. Winner is published with a real @handle
                        and paid on-chain. Final Draw ends on <FinalDrawDate className="text-slate-100" />.
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] text-slate-200">
                          <Users className="h-4 w-4 text-slate-300" />
                          Real handles
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] text-slate-200">
                          <ShieldCheck className="h-4 w-4 text-slate-300" />
                          Proof
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] text-slate-200">
                          <Globe className="h-4 w-4 text-slate-300" />
                          One cadence
                        </span>

                        <TinyTooltip label="Eligibility is verified in the hub when you connect X + wallet.">
                          <span className="xpot-micro-glow inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-950/30 px-3 py-2 text-[12px] text-emerald-100/90">
                            <Info className="h-4 w-4 text-emerald-100/70" />
                            Verified in hub
                          </span>
                        </TinyTooltip>
                      </div>

                      <PrimaryCtaRow countdown={countdown} warmup={warmup} />
                      <CopyMintRow />

                      <div className="mt-5">
                        <WinnerMiniCard winner={winnerSpotlight} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Under-hero rail */}
              <div className="relative z-10 px-4 pb-5 sm:px-6 sm:pb-6 lg:px-8 lg:pb-7">
                <div className="h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />
                <div className="mt-5">
                  <StepRail />
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
      {/* LIVE ACTIVITY */}
      {SHOW_LIVE_FEED ? (
        <div className="mt-10">
          <LiveActivityModule className="" winner={winnerSpotlight} entries={entries} />
        </div>
      ) : null}

      {/* THE PROTOCOL, MADE CLEAR */}
      <section className="mt-10">
        <SectionHeader
          eyebrow="The protocol"
          title="Simple, public, verifiable"
          desc="XPOT is built for social proof. Handles are the face of the protocol. On-chain proof is the backbone."
          right={
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={XPOT_DEXSCREENER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
              >
                Chart
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              </a>
              <a
                href={XPOT_SOLSCAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
              >
                Explorer
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              </a>
            </div>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <PremiumCard className="p-6" halo>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Pill tone="sky">
                <Users className="h-3.5 w-3.5" />
                Identity surface
              </Pill>

              <Pill tone="amber">
                <ShieldCheck className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
                Proof surface
              </Pill>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4 ring-1 ring-white/[0.05]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Handle-first</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                  Your @handle is the public identity. It is what the crowd sees in winners and live activity.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4 ring-1 ring-white/[0.05]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">On-chain proof</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                  When paid, the winner card shows the transaction link. Anyone can verify the payout.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4 ring-1 ring-white/[0.05]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">One cadence</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                  Daily cutoff at 22:00 Madrid. One rhythm for everyone. The countdown never lies.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4 ring-1 ring-white/[0.05]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">No tickets</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                  Eligibility is holdings-based. Claim in the hub to register your daily entry.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3 text-sm`}>
                Enter the hub
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </PremiumCard>

          <PremiumCard className="p-6" halo={false}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Quick actions</p>

            <div className="mt-4 grid gap-2">
              <Link
                href={ROUTE_HUB}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-[13px] font-semibold text-emerald-100 hover:bg-emerald-500/14 transition"
              >
                <span className="inline-flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-emerald-200" />
                  Claim entry (hub)
                </span>
                <ArrowRight className="h-4 w-4 opacity-80" />
              </Link>

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

              <Link
                href={ROUTE_TOKENOMICS_RESERVE}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-slate-100 hover:bg-white/[0.06] transition"
              >
                <span className="inline-flex items-center gap-2">
                  <Crown className={`h-4 w-4 ${GOLD_TEXT}`} />
                  Reserves
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Link>

              <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/25 p-4 ring-1 ring-white/[0.05]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Eligibility check</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                  Connect X + wallet in the hub and we verify holdings and identity. If you qualify, you can claim for
                  today.
                </p>
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
          desc="Homepage stays hype and simple. Hub is where the entry and verification happens."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <FAQItem
            q="Do I need to buy tickets?"
            a="No. Eligibility is based on XPOT holdings. If you qualify, you claim a daily entry in the hub."
            defaultOpen
          />
          <FAQItem
            q="How do I verify a payout?"
            a={
              <span>
                Winner cards show a transaction link once paid. Open it in the explorer to verify on-chain proof.
              </span>
            }
          />
          <FAQItem
            q="Why show avatars and handles?"
            a="Because XPOT is handle-first. Social identity is the surface layer and it makes activity instantly human."
          />
          <FAQItem
            q="When is the Final Draw?"
            a={
              <span>
                Final draw is scheduled for <span className="text-slate-200">{String(RUN_END_EU)}</span>. Countdown on
                this page always shows the next daily cutoff.
              </span>
            }
          />
        </div>

        <div className="mt-6">
          <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3.5 text-sm`}>
            Go to the hub
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* FOOTER (unchanged) */}
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
