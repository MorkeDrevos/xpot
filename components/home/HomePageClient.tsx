// components/home/HomePageClient.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Crown,
  ExternalLink,
  Globe,
  Radio,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
  Wand2,
  Zap,
  Trophy,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';
import XpotFooter from '@/components/XpotFooter';
import FinalDrawDate from '@/components/FinalDrawDate';

import { RUN_DAYS, RUN_END_EU } from '@/lib/xpotRun';

import NextDrawProvider, { useNextDraw } from '@/components/home/NextDrawProvider';
import { calcRunProgress, runTitle } from './madrid';
import { useBonusActive } from './hooks/useBonusActive';
import { useLatestWinner } from './hooks/useLatestWinner';

import MissionBanner from './hero/MissionBanner';
import CosmicHeroBackdrop from './hero/CosmicHeroBackdrop';
import BonusVault from './hero/BonusVault';
import LiveControlRoom from './hero/LiveControlRoom';

import {
  Accordion,
  GOLD_BG_WASH,
  GOLD_BORDER_SOFT,
  GOLD_TEXT,
  GOLD_TEXT_DIM,
  MiniStat,
  Pill,
  PremiumCard,
  shortenAddress,
} from './ui';

const ROUTE_HUB = '/hub';
const ROUTE_WINNERS = '/winners';
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

const BTN_ROYAL_SECONDARY =
  'inline-flex items-center justify-center rounded-full px-5 py-3 text-[13px] font-semibold ' +
  'border border-white/12 bg-slate-950/40 text-slate-100 hover:bg-slate-950/55 transition ' +
  'shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur';

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

function formatDateShort(iso?: string | null) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(t));
  } catch {
    return null;
  }
}

type EntryRow = {
  id?: string;
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  verified?: boolean;
  createdAt?: string | null;
};

function normalizeHandle(h: any) {
  const s = String(h ?? '').trim();
  if (!s) return '';
  const core = s.replace(/^@+/, '').trim();
  return core ? `@${core}` : '';
}

function handleCore(h: any) {
  return normalizeHandle(h).replace(/^@/, '').trim().toLowerCase();
}

/**
 * ✅ Winners-page style name logic:
 * - if name is empty OR basically the same as handle, treat it as missing
 * - prevents "handle twice" everywhere
 */
function displayName(name: any, handle: any) {
  const raw = String(name ?? '').trim();
  if (!raw) return null;

  const nCore = raw.replace(/^@+/, '').trim().toLowerCase();
  const hCore = handleCore(handle);

  if (!nCore) return null;
  if (hCore && nCore === hCore) return null;

  return raw;
}

function displayTitleSubtitle(row: Pick<EntryRow, 'handle' | 'name'>) {
  const h = normalizeHandle(row.handle) || '@unknown';
  const dn = displayName(row.name, h);

  // if we have a real name, show it and keep handle as subtitle
  if (dn) return { title: dn, subtitle: h };

  // otherwise use handle as title and a small vibe subtitle
  return { title: h, subtitle: 'Founding account' };
}

function safeTimeMs(iso?: string | null) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function dedupeByHandleKeepLatest(rows: EntryRow[]) {
  const map = new Map<string, EntryRow>();

  for (const r of rows || []) {
    const handle = normalizeHandle(r?.handle);
    if (!handle) continue;

    const key = handle.toLowerCase();
    const cur = map.get(key);

    const rt = safeTimeMs(r?.createdAt ?? null);
    const ct = cur ? safeTimeMs(cur.createdAt ?? null) : -1;

    if (!cur || rt >= ct) {
      map.set(key, {
        ...r,
        handle,
        name: r?.name ? String(r.name).trim() : r?.name ?? null,
        createdAt: r?.createdAt ?? null,
        avatarUrl: r?.avatarUrl ?? null,
        verified: r?.verified ?? false,
      });
    }
  }

  const out = Array.from(map.values());
  out.sort((a, b) => safeTimeMs(b.createdAt ?? null) - safeTimeMs(a.createdAt ?? null));
  return out;
}

// One avatar resolver for bubbles + list (fixes "empty avatar" list mode)
function avatarUrlForRow(row: Pick<EntryRow, 'handle' | 'avatarUrl'>) {
  const handle = normalizeHandle(row.handle);
  const clean = handle.replace(/^@/, '');
  const cache = Math.floor(Date.now() / (6 * 60 * 60 * 1000)); // 6h bucket
  return row.avatarUrl ?? `https://unavatar.io/twitter/${encodeURIComponent(clean)}?cache=${cache}`;
}

/**
 * No more flashing:
 * - never clears rows on refresh errors
 * - separate initial load vs refreshing
 */
function useTodayEntries(limit: number) {
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (disabled) return;

    let alive = true;

    async function run() {
      if (!alive || disabled) return;

      if (!hasLoadedOnceRef.current) setInitialLoading(true);
      else setRefreshing(true);

      try {
        abortRef.current?.abort();
      } catch {}
      abortRef.current = new AbortController();

      try {
        const res = await fetch(`/api/public/entries/latest?limit=${encodeURIComponent(String(limit))}`, {
          cache: 'no-store',
          signal: abortRef.current.signal,
        });

        if (res.status === 404) {
          if (alive) setDisabled(true);
          return;
        }

        if (!res.ok) {
          // do NOT clear rows (prevents flicker)
          return;
        }

        const json: any = await res.json();
        const candidates = Array.isArray(json?.entries) ? json.entries : [];

        const mapped = candidates
          .map((r: any) => {
            // ✅ DB/API uses xHandle + xName (but keep fallbacks for older payloads)
            const handle = normalizeHandle(r?.xHandle ?? r?.handle ?? r?.user?.xHandle ?? r?.user?.handle);
            if (!handle) return null;

            const nameRaw = r?.xName ?? r?.name ?? r?.user?.xName ?? r?.user?.name ?? null;
            const name = nameRaw ? String(nameRaw).trim() : null;

            const avatarRaw =
              r?.xAvatarUrl ??
              r?.avatarUrl ??
              r?.avatar_url ??
              r?.profileImageUrl ??
              r?.profile_image_url ??
              r?.user?.xAvatarUrl ??
              r?.user?.avatarUrl ??
              r?.user?.avatar_url ??
              r?.user?.profileImageUrl ??
              r?.user?.profile_image_url ??
              null;

            const verifiedRaw =
              r?.verified ??
              r?.isVerified ??
              r?.is_verified ??
              r?.user?.verified ??
              r?.user?.isVerified ??
              r?.user?.is_verified ??
              null;

            return {
              id: r?.id ?? undefined,
              createdAt: r?.createdAt ?? r?.created_at ?? null,
              handle,
              // ✅ normalize “name same as handle” at source so bubbles/list never double-show
              name: displayName(name, handle),
              avatarUrl: avatarRaw ? String(avatarRaw) : null,
              verified: !!verifiedRaw,
            } as EntryRow;
          })
          .filter(Boolean) as EntryRow[];

        const clean = dedupeByHandleKeepLatest(mapped);

        if (alive) {
          setRows(clean);
          hasLoadedOnceRef.current = true;
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        // do NOT clear rows on errors
      } finally {
        if (!alive) return;
        setInitialLoading(false);
        setRefreshing(false);
      }
    }

    run();
    const t = window.setInterval(run, 25_000);

    return () => {
      alive = false;
      window.clearInterval(t);
      try {
        abortRef.current?.abort();
      } catch {}
    };
  }, [limit, disabled]);

  return { rows, initialLoading, refreshing, disabled };
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
            pointer-events-none absolute -inset-10 rounded-full opacity-80 blur-2xl
            bg-[radial-gradient(circle_at_18%_30%,rgba(var(--xpot-gold),0.24),transparent_62%),
                radial-gradient(circle_at_85%_35%,rgba(255,255,255,0.06),transparent_62%)]
          "
        />

        <span className="relative z-10 inline-flex items-center gap-2">
          <span
            className={`
              inline-flex h-7 w-7 items-center justify-center rounded-full
              border ${GOLD_BORDER_SOFT} ${GOLD_BG_WASH}
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
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function TradeOnJupiterCard({ mint }: { mint: string }) {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.00), rgba(0,0,0,0.72) 74%),' +
            'radial-gradient(circle at 22% 48%, rgba(var(--xpot-gold),0.18), transparent 56%),' +
            'radial-gradient(circle at 70% 46%, rgba(139,92,246,0.16), transparent 62%),' +
            'radial-gradient(circle at 58% 60%, rgba(56,189,248,0.05), transparent 65%)',
          opacity: 1,
        }}
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">Trade</p>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
            Primary venue is Jupiter. Always verify the mint and use official links.
          </p>

          <div className="mt-3 grid gap-2 sm:flex sm:items-center">
            <a
              href={XPOT_JUP_SWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Trade XPOT on Jupiter"
              className="
                xpot-btn-vault
                group
                relative
                inline-flex items-center justify-center
                rounded-full
                w-full sm:w-auto
                px-6 py-3.5
                text-sm font-semibold
                transition
                hover:brightness-[1.03]
                active:brightness-[0.99]
                active:scale-[0.99]
              "
            >
              Trade on Jupiter
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />

              <span
                aria-hidden
                className="pointer-events-none absolute -inset-10 opacity-55 blur-2xl"
                style={{
                  background:
                    'radial-gradient(circle at 20% 35%, rgba(34,211,238,0.10), transparent 60%),' +
                    'radial-gradient(circle at 78% 30%, rgba(168,85,247,0.08), transparent 62%),' +
                    'radial-gradient(circle at 45% 70%, rgba(var(--xpot-gold),0.12), transparent 62%)',
                }}
              />
            </a>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <a
                href={XPOT_DEXSCREENER_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="View chart"
                className="xpot-btn xpot-btn-utility rounded-full w-full sm:w-auto px-4 py-3 text-[13px]"
              >
                <TrendingUp className="h-4 w-4" />
                Chart
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </a>

              <a
                href={XPOT_SOLSCAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="View on Solscan"
                className="xpot-btn xpot-btn-utility rounded-full w-full sm:w-auto px-4 py-3 text-[13px]"
              >
                <ShieldCheck className="h-4 w-4" />
                Explorer
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </a>
            </div>
          </div>

          <p className="mt-3 font-mono text-[11px] text-slate-500">mint: {shortenAddress(mint, 8, 8)}</p>
        </div>
      </div>
    </div>
  );
}

function AvatarBubble({
  row,
  size = 56,
  isWinner,
}: {
  row: EntryRow;
  size?: number;
  isWinner?: boolean;
}) {
  const handle = normalizeHandle(row.handle);
  const clean = handle.replace(/^@/, '');

  const img = avatarUrlForRow(row);
  const { title, subtitle } = displayTitleSubtitle(row);

  return (
    <a
      href={`https://x.com/${encodeURIComponent(clean)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative"
      title={handle}
    >
      <div
        className="
          pointer-events-none
          absolute bottom-full left-1/2 z-[999]
          block -translate-x-1/2 pb-3
          opacity-0 translate-y-1 scale-[0.98]
          transition duration-150 ease-out
          delay-150
          group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
        "
      >
        <div
          className="
            relative w-56
            rounded-2xl border border-white/10
            bg-slate-950/95
            px-3.5 py-3
            shadow-[0_26px_80px_rgba(0,0,0,0.70)]
            backdrop-blur
          "
        >
          <div
            aria-hidden
            className="
              absolute left-1/2 top-full
              -translate-x-1/2
              h-3 w-3 rotate-45
              border border-white/10
              bg-slate-950/95
              shadow-[0_14px_40px_rgba(0,0,0,0.55)]
            "
          />

          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={handle}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />

              {row.verified ? (
                <span
                  className="
                    absolute -bottom-1 -right-1
                    inline-flex h-5 w-5 items-center justify-center
                    rounded-full border border-white/10
                    bg-sky-500/20
                    ring-1 ring-sky-400/20
                    shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                    backdrop-blur
                  "
                  title="Verified"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-200" />
                </span>
              ) : null}
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-[13px] font-semibold text-slate-100">{title}</div>

                {isWinner ? (
                  <span
                    className="
                      inline-flex items-center gap-1
                      rounded-full
                      border border-amber-300/20
                      bg-amber-500/10
                      px-2 py-0.5
                      text-[10px] font-semibold
                      text-amber-200
                      shadow-[0_0_0_1px_rgba(251,191,36,0.10)]
                    "
                    title="Winner"
                  >
                    <Crown className="h-3 w-3" />
                    XPOT
                  </span>
                ) : null}
              </div>

              <div className="truncate text-[12px] text-slate-400">{subtitle}</div>
              <div className="mt-1 text-[11px] text-slate-500">View on X</div>
            </div>
          </div>
        </div>
      </div>

      <span className="pointer-events-none absolute -inset-2 rounded-full opacity-0 blur-xl transition group-hover:opacity-100 bg-[radial-gradient(circle_at_40%_40%,rgba(56,189,248,0.22),transparent_62%),radial-gradient(circle_at_60%_55%,rgba(var(--xpot-gold),0.18),transparent_60%)]" />

      <span
        className="relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={handle} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      </span>
    </a>
  );
}

/* =========================
   Stage (TOP-LEVEL)
========================= */
function Stage({ latestWinner }: { latestWinner: any }) {
  const { rows: entries, initialLoading, refreshing } = useTodayEntries(24);
  const [mode, setMode] = useState<'bubbles' | 'list'>('bubbles');

  const cleanEntries = useMemo(() => dedupeByHandleKeepLatest(entries), [entries]);

  const uniqCount = useMemo(() => {
    const s = new Set(cleanEntries.map(e => (e.handle || '').toLowerCase()));
    s.delete('');
    return s.size;
  }, [cleanEntries]);

  const winnerHandle = (latestWinner as any)?.handle ?? null;
  const winnerNameRaw = (latestWinner as any)?.name ?? null;
  const winnerName = displayName(winnerNameRaw, winnerHandle);
  const winnerAvatar = (latestWinner as any)?.avatarUrl ?? null;
  const winnerAmount = (latestWinner as any)?.amountXpot ?? null;
  const winnerTxUrl = (latestWinner as any)?.txUrl ?? null;
  const winnerDate = formatDateShort((latestWinner as any)?.drawDate ?? null);

  const showEmpty = !initialLoading && cleanEntries.length === 0;

  return (
    <section className="mt-7">
      <PremiumCard className="p-6 sm:p-8 overflow-visible" halo sheen>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">Live activity</p>
            <h2 className="mt-2 text-balance text-2xl font-semibold text-slate-50 sm:text-3xl">The XPOT stage</h2>
          </div>

          <Link
            href={ROUTE_HUB}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
            title="Enter the hub"
          >
            Enter today&apos;s XPOT
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 overflow-visible">
          {/* Entries */}
          <div className="relative isolate overflow-visible rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-5 lg:order-1">
            <div className="pointer-events-none absolute -inset-20 opacity-85 blur-3xl bg-[radial-gradient(circle_at_20%_25%,rgba(56,189,248,0.14),transparent_62%),radial-gradient(circle_at_82%_25%,rgba(var(--xpot-gold),0.14),transparent_62%)]" />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    Entries
                  </span>
                </p>
                <p className="mt-2 text-[12px] text-slate-400">
                  {initialLoading ? 'Updating...' : `${uniqCount || 0} unique entrants`}
                  {refreshing ? <span className="ml-2 text-slate-500">refreshing</span> : null}
                </p>
              </div>

              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setMode('bubbles')}
                  className={[
                    'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition',
                    mode === 'bubbles' ? 'bg-white/[0.07] text-slate-100' : 'text-slate-400 hover:text-slate-200',
                  ].join(' ')}
                  title="Bubbles"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Bubbles
                </button>

                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className={[
                    'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition',
                    mode === 'list' ? 'bg-white/[0.07] text-slate-100' : 'text-slate-400 hover:text-slate-200',
                  ].join(' ')}
                  title="List"
                >
                  <ListIcon className="h-3.5 w-3.5" />
                  List
                </button>
              </div>
            </div>

            <div className="relative mt-6">
              {showEmpty ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <p className="text-[12px] text-slate-400">Enter via the hub to appear here.</p>
                  <Link
                    href={ROUTE_HUB}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
                  >
                    Enter hub
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : mode === 'bubbles' ? (
                <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
                  {cleanEntries.slice(0, 18).map((e, idx) => {
                    const size = idx === 0 ? 72 : idx < 4 ? 62 : 54;

                    const isWinner =
                      !!winnerHandle &&
                      normalizeHandle(e.handle).toLowerCase() === normalizeHandle(winnerHandle).toLowerCase();

                    return <AvatarBubble key={(e.id ?? e.handle).toString()} row={e} size={size} isWinner={isWinner} />;
                  })}

                  <div className="w-full pt-2 text-center text-[12px] text-slate-400">
                    <span className="text-slate-200">{uniqCount}</span> today
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {cleanEntries.slice(0, 10).map(e => {
                    const h = normalizeHandle(e.handle);
                    const img = avatarUrlForRow(e);
                    const { title, subtitle } = displayTitleSubtitle(e);

                    return (
                      <a
                        key={(e.id ?? h).toString()}
                        href={`https://x.com/${encodeURIComponent(h.replace('@', ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition"
                        title={h}
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt={h} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-100">{title}</p>
                          <p className="truncate text-[12px] text-slate-400">{subtitle}</p>
                        </div>

                        <ExternalLink className="ml-auto h-4 w-4 text-slate-600 group-hover:text-slate-400 transition" />
                      </a>
                    );
                  })}
                  <div className="pt-1 text-[12px] text-slate-500">Enter via the hub to join today&apos;s list.</div>
                </div>
              )}
            </div>
          </div>

          {/* Latest winner */}
          <div className="relative overflow-hidden rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-5 lg:order-2">
            <div className="pointer-events-none absolute -inset-20 opacity-80 blur-3xl bg-[radial-gradient(circle_at_18%_30%,rgba(var(--xpot-gold),0.20),transparent_62%),radial-gradient(circle_at_86%_26%,rgba(56,189,248,0.12),transparent_62%)]" />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Trophy className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
                    Latest winner
                  </span>
                </p>

                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-[rgba(var(--xpot-gold),1)]">
                    {typeof winnerAmount === 'number' ? winnerAmount.toLocaleString() : '1,000,000'}
                  </span>
                  <span className="text-[12px] font-semibold text-slate-400">XPOT</span>
                </div>

                <p className="mt-2 text-[12px] text-slate-400">
                  {winnerDate ? (
                    <>
                      Draw date: <span className="text-slate-200">{winnerDate}</span>
                    </>
                  ) : (
                    <>Draw date: recorded on-chain</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {winnerTxUrl ? (
                  <a
                    href={winnerTxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
                    title="View TX"
                  >
                    TX
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </a>
                ) : null}

                <Link
                  href={ROUTE_WINNERS}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
                  title="Open winners archive"
                >
                  Archive
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                </Link>
              </div>
            </div>

            <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  {winnerAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={winnerAvatar}
                      alt={normalizeHandle(winnerHandle) || 'winner'}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-200">
                      {(normalizeHandle(winnerHandle) || '@w').replace('@', '').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-slate-100">
                    {winnerName || normalizeHandle(winnerHandle) || 'Winner'}
                  </p>
                  <p className="truncate text-[12px] text-slate-400">{normalizeHandle(winnerHandle) || '@unknown'}</p>
                </div>

                <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-slate-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.55)]" />
                  Live
                </span>
              </div>
            </div>

            <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">See more winners</p>
                <p className="mt-1 text-[12px] text-slate-400">Full archive, TX links and history on the winners page.</p>
              </div>
              <Link
                href={ROUTE_WINNERS}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
              >
                Open winners
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </PremiumCard>
    </section>
  );
}

function HomeInner() {
  const bonusActive = useBonusActive();
  const latestWinner = useLatestWinner();

  const { countdown, cutoffLabel, nowMs } = useNextDraw();
  const run = useMemo(() => calcRunProgress(new Date(nowMs)), [nowMs]);
  const runLine = useMemo(() => `DAY ${run.day}/${RUN_DAYS}`, [run.day]);

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
    document.title = runTitle(run.day, run.started, run.ended, cutoffLabel);
    setMeta(
      'description',
      `XPOT is a daily draw protocol with handle-first identity and on-chain verification. Final draw: ${RUN_END_EU}.`,
    );
  }, [run.day, run.started, run.ended, cutoffLabel]);

  const faq = useMemo(
    () => [
      {
        q: 'What is "The Final Draw" exactly?',
        a: `It’s the finale of a 7000-day global XPOT run. Daily entries happen through the hub and the run ends at ${RUN_END_EU}.`,
      },
      {
        q: 'Do I need tickets to enter?',
        a: 'No tickets. Eligibility is holdings-based. Hold XPOT, verify eligibility in the hub and enter once per day.',
      },
      {
        q: 'Why do winners show as @handle?',
        a: 'XPOT is handle-first: winners and history are presented by X handle for a clean public layer while payouts remain self-custody and wallet-native.',
      },
      {
        q: 'How can anyone verify outcomes?',
        a: 'Outcomes are on-chain. Anyone can verify distributions in an explorer.',
      },
    ],
    [],
  );

  const hero = (
    <section className="relative">
      <div aria-hidden className="h-[calc(var(--xpot-banner-h,56px)+var(--xpot-topbar-h,112px)+14px)]" />
      <MissionBanner reservesHref={ROUTE_TOKENOMICS_RESERVE} />

      <div className="relative overflow-hidden border-y border-slate-900/60 bg-slate-950/20 shadow-[0_60px_220px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.06),rgba(0,0,0,0.60))]" />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(circle at 12% 18%, rgba(var(--xpot-gold),0.16), transparent 55%),' +
              'radial-gradient(circle at 86% 22%, rgba(56,189,248,0.10), transparent 58%),' +
              'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06), transparent 62%),' +
              'linear-gradient(90deg, rgba(0,0,0,0), rgba(var(--xpot-gold),0.04), rgba(0,0,0,0))',
          }}
        />

        <div className="relative z-10 w-full px-0">
          <div className="py-5 sm:py-7">
            <div className="relative w-full overflow-hidden rounded-[38px] border border-slate-900/70 bg-slate-950/35 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <CosmicHeroBackdrop />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.55),rgba(255,255,255,0.10),rgba(56,189,248,0.28),transparent)]" />

              <div
                className="
                  relative z-10
                  grid gap-6 p-4 sm:p-6 lg:p-8
                  lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.52fr)]
                "
              >
                <div className="flex flex-col justify-between gap-6 lg:pt-8">
                  <div className="space-y-6">
                    <div className="relative p-2 sm:p-3">
                      <div className="relative mt-2">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em]',
                              `border ${GOLD_BORDER_SOFT} ${GOLD_BG_WASH}`,
                              'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10),0_18px_60px_rgba(0,0,0,0.55)]',
                            ].join(' ')}
                          >
                            <Crown className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
                            Royal protocol run
                          </span>

                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                            <Radio className="h-3.5 w-3.5 text-emerald-200" />
                            Live cadence
                          </span>
                        </div>

                        <h1 className="text-5xl font-semibold tracking-tight text-white">
                          One protocol.
                          <br />
                          One daily <span className="xpot-xpotword">XPOT</span> draw.
                        </h1>

                        <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-slate-400">
                          Ceremonial by design. Verifiable by default. <span className="text-slate-200">Final Draw</span>{' '}
                          ends on <FinalDrawDate className="text-slate-200" />.
                        </p>

                        <div className="mt-5 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.42),rgba(255,255,255,0.08),transparent)]" />
                      </div>

                      <div className="mt-4 grid gap-4 lg:hidden">
                        <PremiumCard className="p-4" halo sheen>
                          <div className="xpot-console-sweep" aria-hidden />
                          <div className="relative z-10">
                            <JackpotPanel variant="standalone" layout="wide" />
                          </div>
                        </PremiumCard>
                      </div>

                      <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 ring-1 ring-white/[0.05]">
                        <div
                          className="pointer-events-none absolute -inset-12 opacity-70 blur-2xl"
                          style={{
                            background:
                              'radial-gradient(circle at 18% 40%, rgba(var(--xpot-gold),0.14), transparent 60%),' +
                              'radial-gradient(circle at 82% 30%, rgba(56,189,248,0.08), transparent 62%)',
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

                          <span
                            className={[
                              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]',
                              `border ${GOLD_BORDER_SOFT} ${GOLD_BG_WASH}`,
                            ].join(' ')}
                          >
                            <Zap className={`h-3.5 w-3.5 ${GOLD_TEXT}`} />
                            Cutoff approaches
                          </span>
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
                        <Link
                          href={ROUTE_HUB}
                          title="Enter the hub"
                          className="
                            xpot-btn-vault
                            group
                            relative
                            inline-flex items-center justify-center
                            w-full sm:w-auto
                            rounded-full
                            px-6 py-3.5
                            text-sm font-semibold
                            transition
                            hover:brightness-[1.03]
                            active:brightness-[0.99]
                            active:scale-[0.99]
                          "
                        >
                          Enter the hub
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>

                        <a
                          href={XPOT_JUP_SWAP_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={BTN_ROYAL_SECONDARY}
                          title="Buy XPOT on Jupiter"
                        >
                          Buy XPOT
                          <ExternalLink className="ml-2 h-4 w-4 text-slate-500" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Run day" value={`#${run.day}/${RUN_DAYS}`} tone="amber" />
                    <MiniStat label="Next cutoff" value={countdown} tone="emerald" />
                    <MiniStat label="Final draw" value={<FinalDrawDate variant="short" />} tone="sky" />
                  </div>
                </div>

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
                  <motion.div style={reduceMotion ? undefined : { boxShadow: depthShadow as any }}>
                    <PremiumCard className="p-5 sm:p-6" halo sheen>
                      <div className="xpot-console-sweep" aria-hidden />
                      <div className="relative z-10">
                        <JackpotPanel variant="standalone" layout="wide" />
                      </div>
                    </PremiumCard>
                  </motion.div>

                  <PremiumCard className="p-5 sm:p-6" halo={false}>
                    <LiveControlRoom countdown={countdown} cutoffLabel={cutoffLabel} runLine={runLine} />
                  </PremiumCard>
                </motion.div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.40),rgba(255,255,255,0.08),transparent)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <XpotPageShell pageTag="home" fullBleedTop={hero}>
      <Stage latestWinner={latestWinner} />

      {/* rest unchanged */}
      <XpotFooter />
    </XpotPageShell>
  );
}

export default function HomePageClient() {
  return (
    <NextDrawProvider>
      <HomeInner />
    </NextDrawProvider>
  );
}
