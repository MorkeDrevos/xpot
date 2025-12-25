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
  Info,
  Radio,
  Flame,
  CheckCircle2,
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';
import XpotFooter from '@/components/XpotFooter';
import { createPortal } from 'react-dom';

const ROUTE_HUB = '/hub';
const ROUTE_TERMS = '/terms';
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
const GOLD_BORDER_SOFT = 'border-[rgba(var(--xpot-gold),0.25)]';
const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
const GOLD_BG_WASH_2 = 'bg-[rgba(var(--xpot-gold),0.08)]';
const GOLD_RING_SHADOW = 'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]';

// ─────────────────────────────────────────────
// FINAL DRAW RUN (7000-day campaign)
// ─────────────────────────────────────────────

const RUN_DAYS = 7000;

const RUN_START = { y: 2025, m: 12, d: 25, hh: 22, mm: 0 }; // Madrid wall-clock
const RUN_END = { y: 2045, m: 2, d: 22, hh: 22, mm: 0 }; // Madrid wall-clock (locked)

const RUN_START_EU = '25/12/2025 22:00 (Madrid)';
const RUN_END_EU = '22/02/2045 22:00 (Madrid)';

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
    amber: `${GOLD_BORDER_SOFT} ${GOLD_BG_WASH} ${GOLD_TEXT} ${GOLD_RING_SHADOW}`,
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

/* Bonus visibility:
   - Hide the entire block until an API reports "active".
   - If endpoint fails, keep hidden (safe default). */
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

/* ─────────────────────────────────────────────
   Control room (read-only live view)
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
    ``,
    `> LAST_WINNERS`,
    `  #2025-12-18  winner   ${XPOT_SIGN}1,000,000`,
    `  #2025-12-18  bonus    ${XPOT_SIGN}250,000`,
    `  #2025-12-17  winner   ${XPOT_SIGN}1,000,000`,
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

/* ─────────────────────────────────────────────
   Floating hero surface (LEFT)
───────────────────────────────────────────── */

function FloatingHeroLeft({
  countdown,
  cutoffLabel,
  run,
  mint,
  bonusActive,
}: {
  countdown: string;
  cutoffLabel: string;
  run: { day: number; daysRemaining: number; started: boolean; ended: boolean };
  mint: string;
  bonusActive: boolean;
}) {
  const progressPct = Math.max(0, Math.min(100, (run.day / RUN_DAYS) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative"
    >
      {/* floating aura */}
      <div
        className="
          pointer-events-none absolute -inset-20 opacity-80 blur-3xl
          bg-[radial-gradient(circle_at_10%_10%,rgba(16,185,129,0.18),transparent_55%),
              radial-gradient(circle_at_90%_18%,rgba(56,189,248,0.14),transparent_55%),
              radial-gradient(circle_at_35%_100%,rgba(var(--xpot-gold),0.12),transparent_60%),
              radial-gradient(circle_at_70%_95%,rgba(139,92,246,0.12),transparent_62%)]
        "
      />

      {/* single surface */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
        className="
          relative overflow-hidden rounded-[38px]
          border border-white/10 bg-white/[0.03]
          ring-1 ring-white/[0.06]
          shadow-[0_60px_190px_rgba(0,0,0,0.62)]
          backdrop-blur-xl
        "
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.45),rgba(255,255,255,0.08),rgba(56,189,248,0.25),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.06),rgba(0,0,0,0.35))]" />

        {/* subtle parallax lines */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-10 opacity-30"
          animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute left-0 top-10 h-px w-[120%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />
          <div className="absolute left-0 top-28 h-px w-[120%] bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.12),transparent)]" />
          <div className="absolute left-0 top-44 h-px w-[120%] bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.12),transparent)]" />
        </motion.div>

        <div className="relative z-10 p-6 sm:p-7 lg:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">
            NO TICKETS · JUST XPOT HOLDINGS
          </p>

          <h1 className="mt-4 text-balance text-[40px] font-semibold leading-[1.05] sm:text-[56px]">
            One protocol.
            <br />
            <span className="text-emerald-300">One daily XPOT draw.</span>
          </h1>

          <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
            Daily draws are the heartbeat. The Final Draw is the ending -{' '}
            <span className="text-slate-200">{RUN_END_EU}</span>.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Pill tone="emerald">
              <Users className="h-3.5 w-3.5" />
              X handle identity
            </Pill>
            <Pill tone="violet">
              <Blocks className="h-3.5 w-3.5" />
              Protocol layer
            </Pill>
            <Pill tone="amber">
              <Timer className="h-3.5 w-3.5" />
              Next draw {countdown}
            </Pill>
          </div>

          {/* calmer story + entry card */}
          <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="rounded-[28px] bg-black/20 p-5 ring-1 ring-white/[0.06]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="amber">
                      <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
                      The Final Draw Run
                    </Pill>
                    <Pill tone="emerald">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Holdings-based entry
                    </Pill>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-100">
                    Hold at least <span className={GOLD_TEXT}>$100,000</span> worth of XPOT
                  </p>
                  <p className="mt-1 text-[12px] text-slate-400">
                    Entry is claim-based in the hub. No tickets. No checkout.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={ROUTE_TOKENOMICS_RESERVE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      inline-flex items-center justify-center rounded-full
                      border border-white/10 bg-white/[0.03]
                      px-4 py-2 text-[12px] font-semibold text-slate-100
                      hover:bg-white/[0.06] transition
                    "
                  >
                    View tokenomics
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>

                  <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-5 py-2.5 text-sm`} title="Enter via the hub">
                    Enter hub
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>

              {/* progress (no extra boxes) */}
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400">
                    Day <span className={GOLD_TEXT}>{run.day}</span>/<span className="text-slate-300">{RUN_DAYS}</span>
                    <span className="text-slate-600"> • </span>
                    <span className="text-slate-300">{run.daysRemaining} days remaining</span>
                  </p>

                  <span className="text-[11px] text-slate-500">
                    {run.ended ? 'Final moment is live.' : `Cutoff: ${cutoffLabel}`}
                  </span>
                </div>

                <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.70),rgba(56,189,248,0.55),rgba(var(--xpot-gold),0.55))]"
                    style={{ width: `${progressPct}%` }}
                  />
                  <div className="pointer-events-none absolute inset-0 opacity-60 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] bg-black/20 p-5 ring-1 ring-white/[0.06]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Protocol signals</p>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Identity</span>
                  <span className="font-mono text-slate-100">@handle-first</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Proof</span>
                  <span className="text-slate-100">On-chain payouts</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Next draw</span>
                  <span className="font-mono text-emerald-200">{countdown}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link href={ROUTE_HUB} className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}>
                  See eligibility
                  <Info className="ml-2 h-4 w-4 text-slate-300" />
                </Link>

                <Link href={ROUTE_TERMS} className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}>
                  Terms
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
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

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <RoyalContractBar mint={mint} />
            <p className="text-[11px] text-slate-500/95">
              Day flips at 22:00 (Madrid). Outcomes are shown by @handle and provable on-chain.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HomePageInner() {
  const bonusActive = useBonusActive();

  const [mint, setMint] = useState(XPOT_CA);
  useEffect(() => setMint(XPOT_CA), []);

  const { countdown, cutoffLabel, nowMs } = useNextDraw();

  const run = useMemo(() => calcRunProgress(new Date(nowMs)), [nowMs]);
  const runLine = useMemo(() => `DAY ${run.day}/${RUN_DAYS}  (final: ${RUN_END_EU})`, [run.day]);

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
        a: `It’s the finale of a 7000-day global XPOT run. Daily entries happen through the hub, and the run ends at ${RUN_END_EU}.`,
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
        q: 'How can anyone verify outcomes?',
        a: 'Outcomes are on-chain. Proof is the product. Anyone can verify distributions in an explorer.',
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
              <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:p-8">
                {/* LEFT (floating, minimal boxes) */}
                <div className="flex flex-col justify-between gap-5">
                  <FloatingHeroLeft
                    countdown={countdown}
                    cutoffLabel={cutoffLabel}
                    run={run}
                    mint={mint}
                    bonusActive={bonusActive}
                  />
                </div>

                {/* RIGHT */}
                <div className="grid gap-4">
                  <PremiumCard className="p-5 sm:p-6" halo sheen>
                    <div className="mt-0">
                      <JackpotPanel variant="standalone" layout="wide" />
                    </div>
                  </PremiumCard>

                  <PremiumCard className="p-5 sm:p-6" halo={false}>
                    <LiveControlRoom countdown={countdown} cutoffLabel={cutoffLabel} runLine={runLine} />
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
      {/* One premium explainer section (trimmed, less boxes) */}
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
                Holdings-based eligibility, handle-first identity and on-chain payout proof. Hub is the action layer. Homepage
                is the story layer.
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
              <p className="text-sm text-slate-300">Clean rules. Public arc. Provable outcomes.</p>
            </div>

            <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-5 py-2.5 text-sm`}>
              Claim your entry
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
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
