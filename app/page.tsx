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
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';

import { createPortal } from 'react-dom';

const ROUTE_HUB = '/hub';
const ROUTE_OPS = '/ops';
const ROUTE_TERMS = '/terms';

const XPOT_CA =
  process.env.NEXT_PUBLIC_XPOT_MINT ||
  process.env.NEXT_PUBLIC_XPOT_CA ||
  'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1';

const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || '';

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

  return (
    <NextDrawContext.Provider value={value}>
      {children}
    </NextDrawContext.Provider>
  );
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
        'relative overflow-hidden rounded-[30px]',
        'border border-slate-900/70 bg-transparent',
        'shadow-[0_32px_110px_rgba(15,23,42,0.85)] backdrop-blur-xl',
        sheen ? 'xpot-sheen' : '',
        className,
      ].join(' ')}
    >
      {halo && (
        <div
          className="
            pointer-events-none absolute -inset-28
            bg-[radial-gradient(circle_at_8%_0%,rgba(16,185,129,0.26),transparent_55%),
                radial-gradient(circle_at_92%_8%,rgba(139,92,246,0.22),transparent_58%),
                radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.16),transparent_58%),
                radial-gradient(circle_at_50%_-10%,rgba(var(--xpot-gold),0.10),transparent_60%)]
            opacity-85
          "
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.55),rgba(255,255,255,0.10),rgba(56,189,248,0.35),transparent)]" />

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
    <div className="rounded-2xl border border-slate-900/70 bg-slate-950/70 px-4 py-3">
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

      <Link
        href={getJupiterSwapUrl(mint)}
        target="_blank"
        className={`
          inline-flex items-center gap-2 rounded-full
          border border-emerald-400/25 bg-emerald-500/10
          px-3.5 py-2 text-[11px] font-semibold text-emerald-200
          hover:bg-emerald-500/15 hover:text-emerald-100
          shadow-[0_18px_60px_rgba(16,185,129,0.14)]
          transition
        `}
        title="Buy XPOT on Jupiter"
      >
        Buy XPOT
        <ExternalLink className="h-4 w-4 text-emerald-200/80" />
      </Link>
    </div>
  );
}

function PrinciplesStrip() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.02] px-4 py-3 backdrop-blur">
        <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.12),transparent_60%)]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Eligibility</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">Hold XPOT</p>
        <p className="mt-1 text-[12px] text-slate-400">No tickets, no purchase flow</p>
      </div>

      <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.02] px-4 py-3 backdrop-blur">
        <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.12),transparent_62%)]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Access</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">Wallet-based</p>
        <p className="mt-1 text-[12px] text-slate-400">Self-custody, no accounts</p>
      </div>

      <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.02] px-4 py-3 backdrop-blur">
        <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_100%_0%,rgba(var(--xpot-gold),0.12),transparent_62%)]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Proof</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">On-chain</p>
        <p className="mt-1 text-[12px] text-slate-400">Verify payouts in explorer</p>
      </div>
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
        <span>Eligibility</span>
        <span className="h-1 w-1 rounded-full bg-white/20" />
        <span>Access</span>
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
          <div key={it.q} className="overflow-hidden rounded-[22px] border border-slate-900/70 bg-slate-950/55">
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
   Countdown (Madrid draw cutoff)
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
        const r = await fetch('/api/public/bonus', { cache: 'no-store' });
        const data = (await r.json().catch(() => null)) as any;
        if (!alive) return;

        const on =
          data?.active === true ||
          data?.isActive === true ||
          data?.enabled === true ||
          data?.status === 'active' ||
          data?.status === 'running';

        setActive(Boolean(on));
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

function HomePageInner() {
  const bonusActive = useBonusActive();

  const [mint, setMint] = useState(XPOT_CA);
  useEffect(() => setMint(XPOT_CA), []);

  const { countdown, cutoffLabel } = useNextDraw();

  const faq = useMemo(
    () => [
      {
        q: 'Do I need to buy tickets to enter?',
        a: 'No. Entry is holdings-based. The hub checks eligibility and handles the entry flow. The homepage stays calm and informational.',
      },
      {
        q: 'Is my wallet public on the site?',
        a: 'No. XPOT is self-custody. Your wallet is used for eligibility and claims, but the product avoids turning wallets into profiles.',
      },
      {
        q: 'How do winners verify payouts?',
        a: 'Payouts are on-chain. Winners can verify the transaction in an explorer. Proof is the product.',
      },
      {
        q: 'What happens after launch?',
        a: 'The daily draw is the primitive. Modules like streaks, creator drops and sponsor-funded pools can plug into the same protocol layer.',
      },
    ],
    [],
  );

  const hero = (
    <section className="relative">
      <style jsx global>{`
        @keyframes xpotHeroSweep {
          0% { transform: translateX(-20%) rotate(8deg); opacity: 0.0; }
          10% { opacity: 0.28; }
          45% { opacity: 0.18; }
          100% { transform: translateX(140%) rotate(8deg); opacity: 0.0; }
        }
        @keyframes xpotHeroDrift {
          0% { transform: translate3d(-2%, -1%, 0); }
          50% { transform: translate3d(2%, 1%, 0); }
          100% { transform: translate3d(-2%, -1%, 0); }
        }
        @keyframes xpotHeroGrid {
          0% { background-position: 0px 0px, 0px 0px; opacity: 0.11; }
          50% { background-position: 120px 80px, -90px 60px; opacity: 0.07; }
          100% { background-position: 0px 0px, 0px 0px; opacity: 0.11; }
        }
        .xpot-hero-cockpit { position: relative; }
        .xpot-hero-cockpit::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: -36px;
          opacity: 0.75;
          filter: blur(40px);
          animation: xpotHeroDrift 12s ease-in-out infinite;
          background:
            radial-gradient(circle at 18% 22%, rgba(56,189,248,0.18), transparent 58%),
            radial-gradient(circle at 82% 18%, rgba(139,92,246,0.18), transparent 60%),
            radial-gradient(circle at 60% 86%, rgba(16,185,129,0.14), transparent 60%);
        }
        .xpot-hero-hudgrid {
          pointer-events: none;
          position: absolute;
          inset: 0;
          opacity: 0.10;
          animation: xpotHeroGrid 16s ease-in-out infinite;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 44px 44px, 44px 44px;
          mask-image: radial-gradient(circle at 40% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.0) 70%);
        }
        .xpot-hero-sweep {
          pointer-events: none;
          position: absolute;
          top: -28%;
          left: -40%;
          width: 55%;
          height: 220%;
          opacity: 0;
          transform: rotate(8deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.10),
            rgba(124,200,255,0.10),
            transparent
          );
          animation: xpotHeroSweep 5.8s ease-in-out infinite;
          mix-blend-mode: screen;
        }
        .xpot-hero-scanlines {
          pointer-events: none;
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.04),
            rgba(255,255,255,0.04) 1px,
            transparent 1px,
            transparent 7px
          );
          mask-image: radial-gradient(circle at 48% 30%, rgba(0,0,0,1), rgba(0,0,0,0.0) 72%);
        }
        .xpot-hero-edgeglow {
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: 30px;
          opacity: 0.0;
          transition: opacity 400ms ease;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.05),
            0 0 28px rgba(59,167,255,0.10);
        }
        .xpot-hero-cockpit:hover .xpot-hero-edgeglow { opacity: 1; }
      `}</style>

      <div aria-hidden className="h-[calc(var(--xpot-banner-h,56px)+var(--xpot-topbar-h,112px)+18px)]" />

      <div className="relative overflow-hidden border-y border-slate-900/60 bg-slate-950/20 shadow-[0_60px_220px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.55))]" />

        <div className="relative z-10 w-full px-0">
          <div className="py-6 sm:py-8">
            <div className="relative w-full overflow-hidden rounded-[38px] border border-slate-900/70 bg-slate-950/35 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.45),rgba(255,255,255,0.08),rgba(56,189,248,0.25),transparent)]" />

              <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:p-8">
                {/* LEFT */}
                <div className="flex flex-col justify-between gap-6">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="emerald">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                        Wallet-based access
                      </Pill>

                      <Pill tone="violet">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
                        Protocol layer
                      </Pill>

                      <Pill tone="amber">
                        <Timer className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
                        Next draw {countdown}
                      </Pill>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono text-slate-300">{XPOT_SIGN}</span>
                      <span>denotes XPOT amounts (USD shown only for estimates)</span>
                      <span className="text-slate-700">•</span>
                      <span className="text-slate-600">{cutoffLabel}</span>
                    </div>

                    <div className="xpot-hero-cockpit rounded-[30px] border border-slate-900/70 bg-slate-950/28 p-5 shadow-[0_30px_110px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-6">
                      <div className="xpot-hero-hudgrid rounded-[30px]" />
                      <div className="xpot-hero-scanlines rounded-[30px]" />
                      <div className="xpot-hero-sweep" />
                      <div className="xpot-hero-edgeglow" />

                      <p className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                        NO TICKETS · JUST XPOT HOLDINGS
                      </p>

                      <div className="relative z-10 mt-3">
                        <h1 className="relative text-balance text-4xl font-semibold leading-[1.05] sm:text-5xl">
                          One protocol.{' '}
                          <span className="text-emerald-300">One daily XPOT draw.</span>
                        </h1>
                      </div>

                      <p className="relative z-10 mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
                        Hold XPOT, connect your wallet and claim your entry. One winner daily, paid on-chain.
                        Built to scale into a rewards ecosystem for communities, creators and sponsors.
                      </p>

                      {/* Runway */}
                      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 px-0 py-0">
                          <ShieldCheck className="h-4 w-4 text-emerald-200/90" />
                          <span className="text-[11px] font-semibold uppercase tracking-[0.20em] text-emerald-200/70">
                            Built with a 10-year rewards runway at launch
                          </span>
                        </div>

                        <TinyTooltip label="Runway = the rewards pool is designed to sustain daily payouts at launch. Exact mechanics can evolve, but payouts remain verifiable on-chain.">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-slate-300/80 hover:text-slate-200 transition">
                            <Info className="h-4 w-4" />
                          </span>
                        </TinyTooltip>
                      </div>

                      <div className="relative z-10 mt-4">
                        <PrinciplesStrip />
                      </div>

                      <div className="relative z-10 mt-5">
                        <SectionDividerLabel label="Entry mechanics" />
                      </div>

                      {/* BONUS XPOT: hidden completely until active */}
                      {bonusActive ? (
                        <div className="relative z-10 mt-3">
                          <div className="relative">
                            <div className="pointer-events-none absolute -inset-10 opacity-75 blur-2xl bg-[radial-gradient(circle_at_30%_40%,rgba(16,185,129,0.28),transparent_62%),radial-gradient(circle_at_75%_30%,rgba(56,189,248,0.18),transparent_62%)]" />
                            <div className="relative rounded-[28px] border border-emerald-400/18 bg-slate-950/50 p-3 shadow-[0_22px_90px_rgba(16,185,129,0.10)]">
                              <div className="mb-2 flex items-center justify-between px-2">
                                <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                                  <span className="relative flex h-2 w-2">
                                    <span className="absolute inset-0 rounded-full bg-emerald-400/70 animate-ping" />
                                    <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                                  </span>
                                  Bonus XPOT
                                </span>

                                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                                  Same entry
                                </span>
                              </div>

                              <BonusStrip variant="home" />
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="relative z-10 mt-4">
                        <RoyalContractBar mint={mint} />
                      </div>

                      <div className="relative z-10 mt-5 flex flex-wrap items-center gap-3">
                        <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3 text-sm`}>
                          Enter today&apos;s XPOT
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>

                      <p className="relative z-10 mt-3 text-[11px] text-slate-500">
                        Winners are provable on-chain. Verification beats vibes.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Mode" value="On-chain" tone="emerald" />
                    <MiniStat label="Access" value="Wallet" tone="sky" />
                    <MiniStat label="Layer" value="Rewards protocol" tone="violet" />
                  </div>
                </div>

                {/* RIGHT */}
                <div className="grid gap-4">
                  <PremiumCard className="p-5 sm:p-6" halo sheen>
                    <div className="mt-0">
                      <JackpotPanel variant="standalone" layout="wide" />
                    </div>
                  </PremiumCard>

                  <PremiumCard className="p-5 sm:p-6" halo={false}>
                    <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-emerald-200/80">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                        Control Room - session view
                      </span>
                      <span className="font-mono text-emerald-200/70">read-only</span>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
                      <pre className="relative z-10 max-h-56 overflow-hidden font-mono text-[11px] leading-relaxed text-emerald-100/90">
{`> XPOT_PROTOCOL
  primitive:       daily reward selection
  access:          wallet-based (self custody)
  proof:           on-chain payout verification
  composable:      modules can plug in later

> NEXT_DRAW
  in:             ${countdown}  (${cutoffLabel})

> LAST_WINNERS
  #2025-12-18  winner   ${XPOT_SIGN}1,000,000
  #2025-12-18  bonus    ${XPOT_SIGN}250,000
  #2025-12-17  winner   ${XPOT_SIGN}1,000,000`}
                      </pre>
                    </div>

                    <p className="mt-3 text-[12px] text-slate-400">
                      Read-only cockpit view. Same panels as ops. Winners get access.
                    </p>
                  </PremiumCard>
                </div>
              </div>

              {/* Removed: LiveEntrantsLounge footer strip */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <XpotPageShell pageTag="home" fullBleedTop={hero}>
      {/* HOW IT WORKS */}
      <section className="mt-8">
        <PremiumCard className="p-6 sm:p-8" halo sheen>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <Pill tone="sky">
                <Blocks className="h-3.5 w-3.5" />
                How it works
              </Pill>

              <h2 className="mt-3 text-balance text-2xl font-semibold text-slate-50 sm:text-3xl">
                A daily reward primitive with provable outcomes.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                XPOT keeps the surface area small: holdings-based eligibility, wallet-based access and on-chain payout proof.
                Everything else can plug in later.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="emerald">
                <ShieldCheck className="h-3.5 w-3.5" />
                Proof first
              </Pill>
              <Pill tone="violet">
                <Users className="h-3.5 w-3.5" />
                Access layer
              </Pill>
              <Pill tone="amber">
                <Stars className="h-3.5 w-3.5" />
                Sponsor ready
              </Pill>
            </div>
          </div>

          <div className="relative mt-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <Step
                n="01"
                title="Hold XPOT"
                desc="Eligibility is checked in the hub"
                icon={<ShieldCheck className="h-5 w-5 text-emerald-200" />}
                tone="emerald"
                tag="Eligibility"
              />
              <Step
                n="02"
                title="Connect wallet"
                desc="Self-custody, no accounts"
                icon={<Users className="h-5 w-5 text-sky-200" />}
                tone="sky"
                tag="Access"
              />
              <Step
                n="03"
                title="Claim entry, verify payout"
                desc="One winner daily. Proof is on-chain"
                icon={<Crown className={`h-5 w-5 ${GOLD_TEXT}`} />}
                tone="amber"
                tag="Payout"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-slate-900/70 bg-slate-950/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <p className="text-sm text-slate-300">Designed for rewards, not addiction loops.</p>
            </div>

            <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-5 py-2.5 text-sm`}>
              Claim your entry
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </PremiumCard>
      </section>

      {/* THE PROTOCOL STRIP (restored) */}
      <section className="mt-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="emerald">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              Qualification
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">No purchases. No tickets.</p>
            <p className="mt-2 text-sm text-slate-300">Holding XPOT is the requirement to enter.</p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="sky">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
              Access
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">Self-custody.</p>
            <p className="mt-2 text-sm text-slate-300">Connect wallet in the hub. Keep control of funds and keys.</p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="amber">
              <span className={`h-1.5 w-1.5 rounded-full bg-[rgb(var(--xpot-gold-2))] ${GOLD_GLOW_SHADOW}`} />
              Payout
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">Paid on-chain in XPOT.</p>
            <p className="mt-2 text-sm text-slate-300">Anyone can verify payouts in an explorer.</p>
          </PremiumCard>
        </div>
      </section>

      {/* ECOSYSTEM LAYER (restored) */}
      <section className="mt-8">
        <PremiumCard className="p-6 sm:p-8" halo sheen>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <Pill tone="violet">
                <Blocks className="h-3.5 w-3.5" />
                Built to be built on
              </Pill>

              <h2 className="mt-3 text-balance text-2xl font-semibold text-slate-50 sm:text-3xl">
                XPOT is a rewards protocol, not a one-off game.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                The daily draw is the primitive. Modules can reward participation, streaks and reputation over time.
                That’s how XPOT becomes an ecosystem for communities, creators and sponsors.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="emerald">
                <ShieldCheck className="h-3.5 w-3.5" />
                Fair by design
              </Pill>
              <Pill tone="sky">
                <Globe className="h-3.5 w-3.5" />
                Sponsor friendly
              </Pill>
              <Pill tone="amber">
                <Stars className="h-3.5 w-3.5" />
                Portable loyalty
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
                <Bullet>Streak boosters and attendance rewards</Bullet>
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
                  <p className="text-sm font-semibold text-slate-100">Access</p>
                  <p className="text-xs text-slate-400">Self-custody, composable</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                <Bullet tone="sky">Wallet connect, no accounts</Bullet>
                <Bullet tone="violet">History and rewards can evolve later</Bullet>
                <Bullet tone="emerald">Low-friction, high-proof</Bullet>
              </ul>
            </div>

            <div className="rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-5">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${GOLD_BORDER_SOFT} ${GOLD_BG_WASH}`}>
                  <ShieldCheck className={`h-5 w-5 ${GOLD_TEXT}`} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">Fairness layer</p>
                  <p className="text-xs text-slate-400">If XPOT picked it, it’s fair</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                <Bullet tone="amber">On-chain proof of payouts</Bullet>
                <Bullet tone="emerald">Transparent mechanics</Bullet>
                <Bullet tone="sky">Reusable selection primitive for other apps</Bullet>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-slate-900/70 bg-slate-950/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <p className="text-sm text-slate-300">XPOT is designed for rewards, not addiction loops.</p>
            </div>

            <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-5 py-2.5 text-sm`}>
              Claim your entry
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </PremiumCard>
      </section>

      {/* WHO IT'S FOR (restored) */}
      <section className="mt-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="sky">
              <Crown className="h-3.5 w-3.5" />
              Creators
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">Giveaways without chaos.</p>
            <p className="mt-2 text-sm text-slate-300">
              One mechanic, provable winners and a premium experience that doesn’t feel spammy.
            </p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="amber">
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
            <p className="mt-2 text-sm text-slate-300">Your XPOT history travels with you and unlocks better rewards over time.</p>
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
                The homepage stays calm. The hub is where entries happen. Proof stays on-chain.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="sky">
                <Users className="h-3.5 w-3.5" />
                Access
              </Pill>
              <Pill tone="amber">
                <Stars className="h-3.5 w-3.5" />
                Proof
              </Pill>
            </div>
          </div>

          <div className="mt-6">
            <Accordion items={faq} />
          </div>
        </PremiumCard>
      </section>

      {/* Footer */}
      <footer className="mt-8 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-slate-400" />
            Pre-Launch Mode. UI is final, wiring continues.
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={ROUTE_OPS}
              className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-900 transition"
            >
              <Lock className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
              Ops
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </Link>

            <Link
              href={ROUTE_TERMS}
              className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-900 transition"
            >
              Terms
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </Link>

            <span className="font-mono text-slate-600">build: cinematic-home</span>
          </div>
        </div>
      </footer>
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
