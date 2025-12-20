// app/page.tsx
// app/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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

import LiveEntrantsLounge from '@/components/LiveEntrantsLounge';
import { type LiveEntrant, asLiveEntrant } from '@/lib/live-entrants';
import { createPortal } from 'react-dom';

const ROUTE_HUB = '/hub';
const ROUTE_OPS = '/ops';
const ROUTE_TERMS = '/terms';

const XPOT_CA =
  process.env.NEXT_PUBLIC_XPOT_MINT ||
  process.env.NEXT_PUBLIC_XPOT_CA ||
  'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1';

const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || '';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full xpot-btn-vault xpot-focus-gold font-semibold transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.45)] hover:bg-emerald-300 transition';

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
    amber:
      'border-amber-400/50 bg-amber-500/10 text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.16)]',
    sky: 'border-sky-400/50 bg-sky-500/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.16)]',
    violet:
      'border-violet-400/45 bg-violet-500/10 text-violet-200 shadow-[0_0_0_1px_rgba(139,92,246,0.16)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${map[tone]}`}
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
                radial-gradient(circle_at_50%_-10%,rgba(245,158,11,0.10),transparent_60%)]
            opacity-85
          "
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(245,158,11,0.55),rgba(255,255,255,0.10),rgba(56,189,248,0.35),transparent)]" />

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
      ? 'text-amber-200'
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

function getSolscanTokenUrl(mint: string) {
  const base = `https://solscan.io/token/${mint}`;
  if (!SOLANA_CLUSTER) return base;
  if (SOLANA_CLUSTER === 'devnet') return `${base}?cluster=devnet`;
  return base;
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
        className="
          relative inline-flex items-center gap-3
          rounded-full border border-amber-400/30 bg-slate-950/55
          px-3.5 py-2
          shadow-[0_22px_90px_rgba(245,158,11,0.12)]
          backdrop-blur-md
        "
        title={mint}
      >
        <div
          className="
            pointer-events-none absolute -inset-10 rounded-full opacity-70 blur-2xl
            bg-[radial-gradient(circle_at_18%_30%,rgba(245,158,11,0.22),transparent_60%),
                radial-gradient(circle_at_85%_35%,rgba(255,255,255,0.06),transparent_62%)]
          "
        />

        <span className="relative z-10 inline-flex items-center gap-2">
          <span
            className="
              inline-flex h-7 w-7 items-center justify-center rounded-full
              border border-amber-400/25 bg-amber-500/10
              shadow-[0_0_22px_rgba(245,158,11,0.22)]
            "
          >
            <ShieldCheck className="h-4 w-4 text-amber-200" />
          </span>

          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
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
              <Check className="h-3.5 w-3.5 text-amber-300" />
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
        href={getSolscanTokenUrl(mint)}
        target="_blank"
        className="
          inline-flex items-center gap-2 rounded-full
          border border-amber-400/18 bg-slate-950/55
          px-3.5 py-2 text-[11px] text-slate-200
          hover:bg-slate-900/60 transition
        "
        title="Open in Solscan"
      >
        Explorer
        <ExternalLink className="h-4 w-4 text-amber-200/70" />
      </Link>
    </div>
  );
}

function RunwayPill() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.16)]">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />
      </span>
      BUILT WITH A 10-YEAR REWARDS RUNWAY AT LAUNCH
    </span>
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Identity</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">@handle</p>
        <p className="mt-1 text-[12px] text-slate-400">Public by X, wallet stays yours</p>
      </div>

      <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.02] px-4 py-3 backdrop-blur">
        <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_100%_0%,rgba(245,158,11,0.12),transparent_62%)]" />
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
      ? 'bg-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.9)]'
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
      ? 'border-amber-500/25 bg-amber-950/20'
      : tone === 'violet'
      ? 'border-violet-500/25 bg-violet-950/25'
      : 'border-emerald-500/25 bg-emerald-950/30';

  const tagTone =
    tone === 'sky'
      ? 'text-sky-200 border-sky-500/25 bg-sky-500/10'
      : tone === 'amber'
      ? 'text-amber-200 border-amber-500/25 bg-amber-500/10'
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
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${ring}`}>{icon}</span>
        <div>
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

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
   Draw time: 22:00 Europe/Madrid
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

function getNextMadridCutoffUtcMs(cutoffHour = 22, now = new Date()) {
  const p = getMadridParts(now);
  const offsetMs = getMadridOffsetMs(now);

  const mkUtcFromMadridWallClock = (yy: number, mm: number, dd: number, hh: number, mi: number, ss: number) => {
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

function cleanHandle(h: string) {
  return (h || '').replace(/^@/, '').trim();
}

function normalizeLiveEntrant(x: any): LiveEntrant | null {
  if (!x) return null;

  // API may return strings
  if (typeof x === 'string') {
    const h = cleanHandle(x);
    if (!h) return null;
    return asLiveEntrant({ handle: h });
  }

  if (typeof x?.handle !== 'string') return null;
  const handle = cleanHandle(x.handle);
  if (!handle) return null;

  const avatarUrl =
    typeof x?.avatarUrl === 'string' && x.avatarUrl.trim() ? x.avatarUrl.trim() : undefined;

  const followers = typeof x?.followers === 'number' ? x.followers : undefined;
  const verified = typeof x?.verified === 'boolean' ? x.verified : undefined;

 // IMPORTANT: subtitle is NOT part of LiveEntrant anymore (locked).
return asLiveEntrant({ handle, avatarUrl, followers, verified });
}

function uniqByHandle(list: LiveEntrant[]) {
  const seen = new Set<string>();
  const out: LiveEntrant[] = [];

  for (const e of list || []) {
    const h = cleanHandle(e?.handle || '');
    if (!h) continue;

    const key = h.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push({ ...e, handle: h });
  }

  return out;
}

export default function HomePage() {
  const [liveEntries, setLiveEntries] = useState<LiveEntrant[]>([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const r = await fetch('/api/public/live-entries', { cache: 'no-store' });

        // If the route sometimes returns HTML/errors, avoid crashing
        const data = (await r.json().catch(() => null)) as any;
        if (!alive) return;

        const raw: any[] = Array.isArray(data?.entries) ? data.entries : [];
        const normalized: LiveEntrant[] = [];

        for (const item of raw) {
          const e = normalizeLiveEntrant(item);
          if (e) normalized.push(e);
        }

        setLiveEntries(uniqByHandle(normalized));
      } catch {
        // ignore
      }
    }

    load();
    const t = window.setInterval(load, 12_000);

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

    // ─────────────────────────────────────────────
  // Time + draw state (required for countdown)
  // ─────────────────────────────────────────────

  const [mint, setMint] = useState(XPOT_CA);

  useEffect(() => {
    setMint(XPOT_CA);
  }, []);

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const nextDrawUtcMs = useMemo(
    () => getNextMadridCutoffUtcMs(22, new Date(nowMs)),
    [nowMs],
  );

  const countdown = useMemo(() => formatCountdown(nextDrawUtcMs - nowMs), [nextDrawUtcMs, nowMs]);

  const faq = useMemo(
    () => [
      {
        q: 'Do I need to buy tickets to enter?',
        a: 'No. Entry is holdings-based. The hub checks eligibility and handles the entry flow. The homepage stays calm and informational.',
      },
      {
        q: 'Is my wallet public on the site?',
        a: 'Your public identity is your X handle. Wallets stay self-custody and aren’t presented as your “profile”.',
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
      <div aria-hidden className="h-[calc(var(--xpot-banner-h,56px)+var(--xpot-topbar-h,112px)+18px)]" />

      <div className="relative overflow-hidden border-y border-slate-900/60 bg-slate-950/30 shadow-[0_60px_220px_rgba(0,0,0,0.65)]">
        <div
          className="
            pointer-events-none absolute -inset-40 opacity-85 blur-3xl
            bg-[radial-gradient(circle_at_12%_12%,rgba(16,185,129,0.24),transparent_58%),
                radial-gradient(circle_at_60%_0%,rgba(56,189,248,0.18),transparent_60%),
                radial-gradient(circle_at_92%_14%,rgba(139,92,246,0.22),transparent_62%),
                radial-gradient(circle_at_82%_92%,rgba(236,72,153,0.12),transparent_66%),
                radial-gradient(circle_at_50%_-10%,rgba(245,158,11,0.14),transparent_60%)]
          "
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.10),rgba(0,0,0,0.55))]" />

        <div className="relative z-10 w-full px-0">
          <div className="py-6 sm:py-8">
            <div className="relative w-full overflow-hidden rounded-[38px] border border-slate-900/70 bg-slate-950/45 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(245,158,11,0.55),rgba(255,255,255,0.10),rgba(56,189,248,0.35),transparent)]" />
              <div
                className="
                  pointer-events-none absolute -inset-40 opacity-85 blur-3xl
                  bg-[radial-gradient(circle_at_12%_10%,rgba(16,185,129,0.20),transparent_55%),
                      radial-gradient(circle_at_86%_16%,rgba(139,92,246,0.22),transparent_58%),
                      radial-gradient(circle_at_82%_92%,rgba(56,189,248,0.16),transparent_60%),
                      radial-gradient(circle_at_55%_0%,rgba(245,158,11,0.12),transparent_58%)]
                "
              />

              <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:p-8">
                {/* LEFT */}
                <div className="flex flex-col justify-between gap-6">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="sky">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                        Identity: @handle
                      </Pill>

                      <Pill tone="violet">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
                        Protocol layer
                      </Pill>

                      <Pill tone="amber">
                        <Timer className="h-3.5 w-3.5 text-amber-200" />
                        Next draw {countdown}
                      </Pill>
                    </div>

                    <div className="rounded-[30px] border border-slate-900/70 bg-slate-950/35 p-5 shadow-[0_30px_110px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                        NO TICKETS · JUST XPOT HOLDINGS
                      </p>

                      <h1 className="mt-3 text-balance text-4xl font-semibold leading-[1.05] sm:text-5xl">
                        One protocol. One identity. <span className="text-emerald-300">One daily XPOT draw.</span>
                      </h1>

                      <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
                        Hold XPOT, connect X and claim your entry. One winner daily, paid on-chain. Built to scale into a rewards
                        ecosystem for communities, creators and sponsors.
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <RunwayPill />
                        <TinyTooltip label="Runway = the rewards pool is designed to sustain daily payouts at launch. Exact mechanics can evolve, but payouts remain verifiable on-chain.">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] transition">
                            <Info className="h-4 w-4" />
                          </span>
                        </TinyTooltip>
                      </div>

                      <div className="mt-4">
                        <PrinciplesStrip />
                      </div>

                      <div className="mt-5">
                        <SectionDividerLabel label="Entry mechanics" />
                      </div>

                      {/* BONUS */}
                      <div className="mt-3">
                        <div className="relative">
                          <div className="pointer-events-none absolute -inset-10 opacity-75 blur-2xl bg-[radial-gradient(circle_at_30%_40%,rgba(16,185,129,0.28),transparent_62%),radial-gradient(circle_at_75%_30%,rgba(56,189,248,0.18),transparent_62%)]" />
                          <div className="relative rounded-[28px] border border-emerald-400/20 bg-slate-950/55 p-3 shadow-[0_22px_90px_rgba(16,185,129,0.12)]">
                            <div className="mb-2 flex items-center justify-between px-2">
                              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                                <span className="relative flex h-2 w-2">
                                  <span className="absolute inset-0 rounded-full bg-emerald-400/70 animate-ping" />
                                  <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                                </span>
                                Bonus XPOT
                              </span>
                              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">same entry</span>
                            </div>

                            <BonusStrip variant="home" />
                          </div>
                        </div>
                      </div>

                      {/* CA bar */}
                      <div className="mt-4">
                        <RoyalContractBar mint={mint} />
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3 text-sm`}>
                          Enter today&apos;s XPOT
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>

                      <p className="mt-3 text-[11px] text-slate-500">
                        Winners revealed by <span className="font-semibold text-slate-200">X handle</span>, never by wallet.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Mode" value="On-chain" tone="emerald" />
                    <MiniStat label="Identity" value="@handle" tone="sky" />
                    <MiniStat label="Layer" value="Rewards protocol" tone="violet" />
                  </div>
                </div>

                {/* RIGHT */}
                <div className="grid gap-4">
                  <PremiumCard className="p-5 sm:p-6" halo sheen>
                    <div className="mt-0">
                      <JackpotPanel variant="standalone" layout="wide" />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Link href={ROUTE_HUB} className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}>
                        Enter now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>

                      <span className="text-[11px] text-slate-500">Watch live here. Claim entries in the hub.</span>
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
                      <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.28),transparent_55%),radial-gradient(circle_at_90%_100%,rgba(139,92,246,0.10),transparent_60%)]" />

                      <pre className="relative z-10 max-h-56 overflow-hidden font-mono text-[11px] leading-relaxed text-emerald-100/90">
{`> XPOT_PROTOCOL
  primitive:       daily reward selection
  identity:        X handle + wallet (self custody)
  proof:           on-chain payout verification
  composable:      modules can plug in later

> NEXT_DRAW
  in:             ${countdown}  (Madrid 22:00)

> LAST_WINNERS
  #2025-12-18  @DeWala_222222   1,000,000 XPOT
  #2025-12-18  @SignalChaser    250,000 XPOT (bonus)
  #2025-12-17  @NFAResearch     1,000,000 XPOT`}
                      </pre>
                    </div>

                    <p className="mt-3 text-[12px] text-slate-400">
                      Read-only cockpit view. Same panels as ops. Winners get access.
                    </p>
                  </PremiumCard>
                </div>
              </div>

              {/* Live entries (always-on) */}
<div className="relative z-10 border-t border-slate-900/70 px-6 py-5 lg:px-8">
  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.28),rgba(255,255,255,0.06),rgba(56,189,248,0.18),transparent)] opacity-70" />

  <div className="relative">
    <LiveEntrantsLounge entrants={liveEntries} hint="Live lobby - updates automatically" />
  </div>
</div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.55))]" />
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
                XPOT keeps the surface area small: holdings-based eligibility, public identity by handle and on-chain payout proof.
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
                Identity layer
              </Pill>
              <Pill tone="amber">
                <Stars className="h-3.5 w-3.5" />
                Sponsor ready
              </Pill>
            </div>
          </div>

          <div className="relative mt-6">
            <div className="pointer-events-none absolute inset-x-2 top-[34px] hidden h-px bg-white/10 lg:block" />
            <div className="pointer-events-none absolute inset-x-2 top-[34px] hidden h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.35),rgba(16,185,129,0.25),rgba(245,158,11,0.18),transparent)] lg:block" />

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
                title="Connect X and wallet"
                desc="Handle is public. Wallet stays self-custody"
                icon={<Users className="h-5 w-5 text-sky-200" />}
                tone="sky"
                tag="Identity"
              />
              <Step
                n="03"
                title="Claim entry, verify payout"
                desc="One winner daily. Proof is on-chain"
                icon={<Crown className="h-5 w-5 text-amber-200" />}
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

      {/* THE PROTOCOL STRIP (kept) */}
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
              Identity
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">Public by handle.</p>
            <p className="mt-2 text-sm text-slate-300">Your X handle is public. Wallet stays self-custody.</p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="amber">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
              Payout
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">Paid on-chain in XPOT.</p>
            <p className="mt-2 text-sm text-slate-300">Winners verify the transaction. Proof stays public.</p>
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
                  <p className="text-sm font-semibold text-slate-100">Identity</p>
                  <p className="text-xs text-slate-400">Reputation across time</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                <Bullet tone="sky">X handle is public. Wallet stays self-custody</Bullet>
                <Bullet tone="violet">History, streaks and wins become your profile</Bullet>
                <Bullet tone="emerald">Anti-bot gravity without KYC vibes</Bullet>
              </ul>
            </div>

            <div className="rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-950/20">
                  <ShieldCheck className="h-5 w-5 text-amber-200" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">Fairness layer</p>
                  <p className="text-xs text-slate-400">If XPOT picked it, it’s fair</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                <Bullet tone="amber">On-chain proof of payouts</Bullet>
                <Bullet tone="emerald">Transparent winner announcements</Bullet>
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

      {/* WHO IT'S FOR */}
      <section className="mt-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="sky">
              <Crown className="h-3.5 w-3.5" />
              Creators
            </Pill>
            <p className="mt-3 text-lg font-semibold text-slate-50">Giveaways without chaos.</p>
            <p className="mt-2 text-sm text-slate-300">One mechanic, transparent winners and a premium experience that doesn’t feel spammy.</p>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6" halo={false}>
            <Pill tone="amber">
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
            <p className="mt-2 text-sm text-slate-300">
              Your XPOT history travels with you and unlocks better rewards over time.
            </p>
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
                Identity
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
              <Lock className="h-3.5 w-3.5 text-amber-200" />
              Ops
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </Link>

            <span className="font-mono text-slate-600">build: cinematic-home</span>
          </div>
        </div>
      </footer>
    </XpotPageShell>
  );
}
