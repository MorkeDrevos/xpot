// app/page.tsx
'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';

const ROUTE_HUB = '/hub';
const ROUTE_OPS = '/ops';
const ROUTE_TERMS = '/terms';

const XPOT_CA =
  process.env.NEXT_PUBLIC_XPOT_MINT ||
  process.env.NEXT_PUBLIC_XPOT_CA ||
  'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1';

const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || '';

const SAMPLE_HANDLES = [
  'DeWala_222222',
  'CryptoNox',
  'XPOTMaxi',
  'ChartHermit',
  'SolanaSignals',
  'LoopMode',
  'BlockByBlock',
  'FlowStateTrader',
  'HypeEngineer',
  'LatencyLord',
  'AlphaSmith',
  'CandleChaser',
];

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.45)] hover:bg-emerald-300 transition';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition';

function Pill({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'sky' | 'violet';
}) {
  const map: Record<string, string> = {
    slate: 'border-white/10 bg-white/[0.04] text-slate-300 shadow-[0_0_0_1px_rgba(15,23,42,0.6)]',
    emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
    amber: 'border-amber-400/35 bg-amber-500/10 text-amber-200',
    sky: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
    violet: 'border-violet-400/35 bg-violet-500/10 text-violet-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${map[tone]}`}
    >
      {children}
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
        // less boxy: lighter border + subtle gradient instead of flat slabs
        'border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02]',
        'shadow-[0_28px_110px_rgba(0,0,0,0.55)] backdrop-blur-xl',
        sheen ? 'xpot-sheen' : '',
        className,
      ].join(' ')}
    >
      {halo && (
        <div
          className="
            pointer-events-none absolute -inset-28 opacity-75 blur-3xl
            bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.18),transparent_55%),
                radial-gradient(circle_at_90%_10%,rgba(139,92,246,0.16),transparent_58%),
                radial-gradient(circle_at_85%_90%,rgba(56,189,248,0.12),transparent_60%)]
          "
        />
      )}
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className={`mt-1 font-mono text-sm ${toneCls}`}>{value}</div>
    </div>
  );
}

function HandleTicker({ handles }: { handles: string[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] px-2 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#02020a] via-[#02020a]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#02020a] via-[#02020a]/70 to-transparent" />

      <motion.div
        className="flex gap-2 pr-10"
        animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }}
        transition={reduceMotion ? undefined : { duration: 34, ease: 'linear', repeat: Infinity }}
      >
        {[0, 1].map(loop => (
          <div key={loop} className="flex gap-2">
            {handles.map(handle => {
              const clean = handle.replace(/^@/, '');
              const initial = clean.charAt(0).toUpperCase();

              return (
                <div
                  key={`${loop}-${handle}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-100/90"
                >
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-semibold text-slate-100">
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                    {initial}
                  </span>
                  <span className="font-mono text-[11px] opacity-80">@{clean}</span>
                </div>
              );
            })}
          </div>
        ))}
      </motion.div>
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
          rounded-full border border-emerald-400/25 bg-white/[0.03]
          px-3.5 py-2
          shadow-[0_18px_70px_rgba(16,185,129,0.10)]
          backdrop-blur-md
        "
        title={mint}
      >
        <div
          className="
            pointer-events-none absolute -inset-10 rounded-full opacity-60 blur-2xl
            bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_60%),
                radial-gradient(circle_at_80%_30%,rgba(245,158,11,0.08),transparent_55%)]
          "
        />

        <span className="relative z-10 inline-flex items-center gap-2">
          <span
            className="
              inline-flex h-7 w-7 items-center justify-center rounded-full
              border border-emerald-400/20 bg-emerald-500/10
              shadow-[0_0_18px_rgba(16,185,129,0.18)]
            "
          >
            <ShieldCheck className="h-4 w-4 text-emerald-200" />
          </span>

          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/90">
              Official CA
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
              <Check className="h-3.5 w-3.5 text-emerald-300" />
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
          border border-white/10 bg-white/[0.03]
          px-3.5 py-2 text-[11px] text-slate-200
          hover:bg-white/[0.06] transition
          backdrop-blur
        "
        title="Open in Solscan"
      >
        Explorer
        <ExternalLink className="h-4 w-4 text-slate-400" />
      </Link>
    </div>
  );
}

function RunwayBadge() {
  const tooltip =
    "Funded for 10+ years of daily XPOT rewards.\nSeeded from the XPOT Rewards Reserve at launch: 1,000,000 XPOT/day baseline for 10+ years.\nPaid in XPOT, on-chain, and auditable.";

  return (
    <div className="relative group inline-flex cursor-default select-none">
      <span className="inline-flex cursor-default items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
        10+ year runway
      </span>

      <div
        className="
          pointer-events-none absolute left-1/2 top-full z-[80] mt-3 w-[320px]
          -translate-x-1/2
          rounded-2xl border border-white/10 bg-[#05050f]
          px-4 py-3 text-[12px] leading-relaxed text-slate-100
          shadow-[0_18px_40px_rgba(0,0,0,0.75)] backdrop-blur-xl
          opacity-0 translate-y-0
          group-hover:opacity-100 group-hover:translate-y-1
          transition-all duration-200
          whitespace-pre-line
        "
      >
        <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-[#05050f] border-l border-t border-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.6)]" />
        {tooltip}
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

function PrinciplesStrip() {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.38)] backdrop-blur">
      <div
        className="
          pointer-events-none absolute -inset-24 opacity-70 blur-3xl
          bg-[radial-gradient(circle_at_12%_20%,rgba(16,185,129,0.14),transparent_55%),
              radial-gradient(circle_at_88%_18%,rgba(56,189,248,0.12),transparent_58%),
              radial-gradient(circle_at_60%_120%,rgba(245,158,11,0.08),transparent_60%)]
        "
      />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Principles</p>
          <span className="hidden sm:inline-block h-4 w-px bg-white/10" />
          <p className="hidden sm:block text-[10px] uppercase tracking-[0.22em] text-slate-600">
            Small surface <span className="mx-2 text-white/15">•</span> Provable outcomes
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-4 grid gap-3 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
          <div className="pointer-events-none absolute -inset-20 opacity-60 blur-3xl bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.16),transparent_55%)]" />
          <div className="relative flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950/25">
              <ShieldCheck className="h-5 w-5 text-emerald-200" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/90">Qualification</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">No purchases. No tickets.</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">Holding XPOT is the requirement to enter.</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
          <div className="pointer-events-none absolute -inset-20 opacity-60 blur-3xl bg-[radial-gradient(circle_at_18%_10%,rgba(56,189,248,0.16),transparent_55%)]" />
          <div className="relative flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-950/20">
              <Users className="h-5 w-5 text-sky-200" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/90">Identity</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">Public by handle.</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
                Your X handle is public. Wallet stays self-custody.
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
          <div className="pointer-events-none absolute -inset-20 opacity-55 blur-3xl bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.12),transparent_55%)]" />
          <div className="relative flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-950/15">
              <Crown className="h-5 w-5 text-amber-200" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/90">Payout</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">Paid on-chain in XPOT.</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
                Winners verify the transaction. Proof stays public.
              </p>
            </div>
          </div>
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
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <div
        className="
          pointer-events-none absolute -inset-24 opacity-60 blur-3xl
          bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.10),transparent_55%),
              radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.10),transparent_55%)]
        "
      />

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
          <div key={it.q} className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] backdrop-blur">
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

export default function HomePage() {
  const marquee = useMemo(() => [...SAMPLE_HANDLES], []);
  const [showLiveEntries, setShowLiveEntries] = useState(false);

  const [mint, setMint] = useState(XPOT_CA);
  useEffect(() => setMint(XPOT_CA), []);

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

  return (
    <XpotPageShell>
      {/* HERO */}
      <section className="mt-6">
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.02] shadow-[0_40px_140px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div
            className="
              pointer-events-none absolute -inset-40 opacity-80 blur-3xl
              bg-[radial-gradient(circle_at_12%_10%,rgba(16,185,129,0.16),transparent_55%),
                  radial-gradient(circle_at_86%_16%,rgba(139,92,246,0.18),transparent_58%),
                  radial-gradient(circle_at_82%_92%,rgba(56,189,248,0.12),transparent_60%)]
            "
          />

          <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)] lg:p-8">
            {/* LEFT: narrative + mechanics */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="sky">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                    Identity: @handle
                  </Pill>
                  <Pill tone="violet">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
                    Protocol layer
                  </Pill>
                  <Pill tone="emerald">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                    Auditable payouts
                  </Pill>
                </div>

                <div className="flex items-center gap-2">
                  <RunwayBadge />
                  <Pill tone="sky">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-pulse" />
                    Live
                  </Pill>
                </div>
              </div>

              <PremiumCard className="p-5 sm:p-6" halo sheen>
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

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Mode" value="On-chain" tone="emerald" />
                  <MiniStat label="Identity" value="@handle" tone="sky" />
                  <MiniStat label="Proof" value="Explorer verifiable" tone="violet" />
                </div>

                <div className="mt-4">
                  <PrinciplesStrip />
                </div>

                <div className="mt-5">
                  <SectionDividerLabel label="Entry mechanics" />
                </div>

                <div className="mt-3 relative">
                  <div
                    className="
                      pointer-events-none absolute -inset-10 opacity-70 blur-2xl
                      bg-[radial-gradient(circle_at_30%_40%,rgba(16,185,129,0.22),transparent_62%),
                          radial-gradient(circle_at_75%_30%,rgba(56,189,248,0.14),transparent_62%)]
                    "
                  />
                  <div className="relative rounded-[28px] border border-emerald-400/20 bg-white/[0.03] p-3 shadow-[0_22px_90px_rgba(16,185,129,0.10)] backdrop-blur">
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

                <div className="mt-4">
                  <RoyalContractBar mint={mint} />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3 text-sm`}>
                    Enter today&apos;s XPOT
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link href={ROUTE_TERMS} className={`${BTN_UTILITY} px-5 py-3 text-sm`}>
                    Terms
                  </Link>

                  <Link
                    href={ROUTE_OPS}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-slate-200 hover:bg-white/[0.06] transition backdrop-blur"
                  >
                    <Lock className="h-4 w-4 text-amber-200" />
                    Operations Center
                  </Link>
                </div>

                <p className="mt-3 text-[11px] text-slate-500">
                  Winners revealed by <span className="font-semibold text-slate-200">X handle</span>, never by wallet.
                </p>
              </PremiumCard>
            </div>

            {/* RIGHT: engine + premium cockpit */}
            <div className="grid gap-4">
              <PremiumCard className="p-5 sm:p-6" halo sheen>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Live XPOT engine</p>
                    <p className="mt-1 text-xs text-slate-400">Pool value and milestones (via Jupiter).</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="sky">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                      Price feed: Jupiter
                    </Pill>
                    <Pill tone="emerald">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                      Updates automatically
                    </Pill>
                  </div>
                </div>

                <div className="mt-4">
                  <JackpotPanel variant="standalone" />
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
                <div className="flex items-center justify-between gap-3">
                  <Pill tone="emerald">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Protocol spec
                  </Pill>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">read-only</span>
                </div>

                <div className="mt-4 rounded-[26px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
                  <div
                    className="
                      pointer-events-none absolute -inset-20 opacity-60 blur-3xl
                      bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.18),transparent_60%),
                          radial-gradient(circle_at_92%_100%,rgba(139,92,246,0.10),transparent_62%)]
                    "
                  />
                  <pre className="relative z-10 max-h-64 overflow-hidden font-mono text-[11px] leading-relaxed text-slate-200/90">
{`> XPOT_PROTOCOL
  primitive:       daily reward selection
  identity:        X handle + wallet (self-custody)
  proof:           on-chain payout verification
  composable:      modules plug in later

> TODAY
  pool_today:      1,000,000 XPOT
  pool_value_usd:  live via Jupiter
  entries_today:   live in hub

> NOTE
  winners announced by handle
  wallets remain self-custody`}
                  </pre>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="Selection" value="One winner daily" tone="amber" />
                  <MiniStat label="Surface area" value="Minimal" tone="violet" />
                </div>

                <p className="mt-3 text-[12px] text-slate-400">
                  Premium by default. The hub is the action layer. This page stays calm and trust-forward.
                </p>
              </PremiumCard>
            </div>
          </div>

          {/* Expandable live entries */}
          <div className="relative z-10 border-t border-white/10 px-6 py-4 lg:px-8">
            <button
              type="button"
              onClick={() => setShowLiveEntries(v => !v)}
              className="group inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition hover:bg-white/[0.06] backdrop-blur"
            >
              <span className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-70 animate-ping" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Live entries (X handles)
                </span>
                <span className="text-[11px] text-slate-500">Optional - expand to view</span>
              </span>

              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showLiveEntries ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
              {showLiveEntries && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3">
                    <HandleTicker handles={marquee} />
                    <p className="mt-2 text-[11px] text-slate-500">Handles are shown. Wallets stay self-custody.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

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
            <div className="pointer-events-none absolute inset-x-2 top-10 hidden h-px bg-white/10 lg:block" />
            <div className="pointer-events-none absolute inset-x-2 top-10 hidden h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.30),rgba(16,185,129,0.22),rgba(245,158,11,0.16),transparent)] lg:block" />

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

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur">
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
            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
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

            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
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

            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
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

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur">
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
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.06] transition backdrop-blur"
            >
              <Lock className="h-3.5 w-3.5 text-amber-200" />
              Ops
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </Link>

            <span className="font-mono text-slate-600">build: cinematic-home-v2</span>
          </div>
        </div>
      </footer>
    </XpotPageShell>
  );
}
