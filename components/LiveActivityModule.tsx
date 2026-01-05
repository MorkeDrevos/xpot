'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crown, Sparkles, Users, Trophy, ExternalLink } from 'lucide-react';

import XAccountIdentity from '@/components/XAccountIdentity';

/* ======================================================
   TYPES (TOP-LEVEL EXPORTS - REQUIRED FOR BUILD)
====================================================== */

export type EntryRow = {
  id?: string;
  createdAt?: string;
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  verified?: boolean;
};

export type LiveWinnerRow = {
  id: string;
  handle: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  wallet: string | null;
  amount?: number | null;
  amountXpot?: number | null;

  // NOTE: We present this everywhere as the CLAIM timestamp (on-chain payout time).
  // Even if your backend historically used it as "drawDate", UI treats it as "claimedAt".
  drawDate: string | null;

  txUrl?: string | null;
  kind?: 'MAIN' | 'BONUS' | null;
  label?: string | null;
  verified?: boolean;
};

/* ======================================================
   HELPERS
====================================================== */

const ROUTE_HUB = '/hub';
const ROUTE_WINNERS = '/winners';

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

function normalizeHandle(h?: string | null) {
  const s = String(h ?? '').trim();
  if (!s) return '@unknown';
  return s.startsWith('@') ? s : `@${s}`;
}

function isUnknownHandle(h?: string | null) {
  const s = normalizeHandle(h);
  return !s || s === '@unknown';
}

function toXProfileUrl(handle: string) {
  const clean = handle.replace(/^@/, '');
  return `https://x.com/${encodeURIComponent(clean)}`;
}

function safeTimeMs(iso?: string | null) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function formatTime(iso?: string | null) {
  const ms = safeTimeMs(iso);
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(ms));
}

// ✅ Date-only (no time) for "Claimed"
function formatDateOnly(iso?: string | null) {
  const ms = safeTimeMs(iso);
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms));
}

function formatXpot(w: LiveWinnerRow | null) {
  const v = w?.amountXpot ?? w?.amount;
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return null;
  return Math.round(v).toLocaleString('en-US');
}

function isValidIso(iso?: string | null) {
  if (!iso) return false;
  return Number.isFinite(Date.parse(iso));
}

function isValidHttpUrl(u?: string | null) {
  if (!u) return false;
  return /^https?:\/\/.+/i.test(u);
}

/**
 * ✅ Fix for double avatars:
 * Dedupe entries by HANDLE only (keep the most recent per handle).
 * Your old logic used `${handle}-${createdAt}` which allows duplicates.
 */
function dedupeByHandleKeepLatest(entries: EntryRow[]) {
  const map = new Map<string, EntryRow>();

  for (const raw of entries ?? []) {
    if (!raw?.handle) continue;

    const h = normalizeHandle(raw.handle);
    const current = map.get(h);

    const rawTs = safeTimeMs(raw.createdAt ?? null);
    const curTs = current ? safeTimeMs(current.createdAt ?? null) : -1;

    // Keep the newest entry for that handle
    if (!current || rawTs >= curTs) {
      map.set(h, {
        ...raw,
        handle: h,
        createdAt: raw.createdAt ?? '',
        name: raw.name ? String(raw.name).trim() : raw.name ?? null,
      });
    }
  }

  const out = Array.from(map.values());
  out.sort((a, b) => safeTimeMs(b.createdAt ?? null) - safeTimeMs(a.createdAt ?? null));
  return out;
}

/* ======================================================
   AVATAR + TOOLTIP (PORTAL)
====================================================== */

function Avatar({
  handle,
  src,
  size,
}: {
  handle: string;
  src?: string | null;
  size: number;
}) {
  const clean = handle.replace('@', '');
  const img =
    src ??
    `https://unavatar.io/twitter/${clean}?cache=${Math.floor(Date.now() / (6 * 60 * 60 * 1000))}`;

  return (
    <div
      className="relative overflow-hidden rounded-full bg-white/5 ring-1 ring-white/15"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt={handle}
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

function TooltipPortal({
  open,
  anchor,
  children,
}: {
  open: boolean;
  anchor: HTMLElement | null;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open || !anchor) return;

    const update = () => {
      const r = anchor.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2, y: r.bottom + 10 });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchor]);

  if (!open || !pos) return null;

  return createPortal(
    <div className="fixed z-[9999]" style={{ left: pos.x, top: pos.y, transform: 'translateX(-50%)' }}>
      {children}
    </div>,
    document.body,
  );
}

function AvatarTooltip({
  handle,
  name,
  avatarUrl,
  meta,
  size = 36,
}: {
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  meta?: string | null;
  size?: number;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [open, setOpen] = useState(false);

  const href = toXProfileUrl(handle);

  return (
    <div className="relative">
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <Avatar handle={handle} src={avatarUrl} size={size} />
      </a>

      <TooltipPortal open={open} anchor={ref.current}>
        <div className="w-[260px] rounded-2xl border border-white/10 bg-black/90 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex gap-3">
            <Avatar handle={handle} src={avatarUrl} size={42} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{handle}</div>
              {name && <div className="truncate text-xs text-slate-400">{name}</div>}
              {meta && <div className="mt-1 text-[10px] text-slate-500">{meta}</div>}
            </div>
          </div>
        </div>
      </TooltipPortal>
    </div>
  );
}

/* ======================================================
   ENTRY RENDERERS
====================================================== */

function EntryLine({ e, idx }: { e: EntryRow; idx: number }) {
  const h = normalizeHandle(e.handle);
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <AvatarTooltip
          handle={h}
          name={e.name}
          avatarUrl={e.avatarUrl}
          meta={e.createdAt ? `Entered ${formatTime(e.createdAt)}` : null}
        />
        <div className="truncate text-sm font-semibold text-white">{h}</div>
      </div>
      <div className="text-[10px] text-slate-400">{idx === 0 ? 'just now' : 'today'}</div>
    </div>
  );
}

function BubbleEntrants({ entries }: { entries: EntryRow[] }) {
  // ✅ extra safety: entries coming in here are already deduped, but we keep it bulletproof
  const unique = useMemo(() => dedupeByHandleKeepLatest(entries), [entries]);

  return (
    <div className="flex flex-wrap justify-center gap-3 py-4">
      {unique.slice(0, 24).map((e, i) => {
        const size = i === 0 ? 72 : i < 4 ? 56 : 44;
        const h = normalizeHandle(e.handle);

        return (
          <AvatarTooltip
            key={h} // ✅ key by handle, not index (prevents weird React reuse)
            handle={h}
            name={e.name}
            avatarUrl={e.avatarUrl}
            meta={e.createdAt ? `Entered ${formatTime(e.createdAt)}` : null}
            size={size}
          />
        );
      })}
    </div>
  );
}

/* ======================================================
   MAIN COMPONENT
====================================================== */

export default function LiveActivityModule({
  winner,
  entries,
  className = '',
}: {
  winner: LiveWinnerRow | null;
  entries: EntryRow[];
  className?: string;
}) {
  // ✅ MAIN FIX: dedupe by handle ONLY (keep most recent)
  const clean = useMemo(() => dedupeByHandleKeepLatest(entries), [entries]);

  const [view, setView] = useState<'bubbles' | 'list'>('bubbles');

  const prize = formatXpot(winner);
  const winnerHandle = normalizeHandle(winner?.handle ?? '');
  const winnerName = winner?.name?.trim() || null;

  // Present drawDate as CLAIMED timestamp everywhere (per your new rule)
  const claimedIso = isValidIso(winner?.drawDate) ? winner?.drawDate : null;
  const claimedLabel = claimedIso ? formatDateOnly(claimedIso) : null;

  const canLinkX = !isUnknownHandle(winnerHandle);
  const xHref = canLinkX ? toXProfileUrl(winnerHandle) : null;

  const hasTx = isValidHttpUrl(winner?.txUrl);

  return (
    <section
      className={cx(
        'rounded-[32px] border border-white/10 bg-white/5 ring-1 ring-white/5 shadow-[0_60px_160px_rgba(0,0,0,0.6)]',
        className,
      )}
    >
      <div className="space-y-5 p-5">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-400">
              <Sparkles className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
              Live activity
            </div>
            <div className="mt-1 text-lg font-semibold text-white">The XPOT stage</div>
          </div>

          <Link
            href={ROUTE_HUB}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
          >
            Enter today&apos;s XPOT
          </Link>
        </div>

        {/* CONTENT */}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          {/* WINNER */}
          <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <Crown className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                Latest winner
              </div>

              <div className="flex items-center gap-2">
                {hasTx && winner?.txUrl ? (
                  <a
                    href={winner.txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                    title="View transaction"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Tx
                  </a>
                ) : null}

                <Link
                  href={ROUTE_WINNERS}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                  title="Open winners archive"
                >
                  <Trophy className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                  Archive
                </Link>
              </div>
            </div>

            {/* PROMO LINE */}
            <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400">
              WINNER JUST TOOK HOME
            </div>

            {/* AMOUNT (✅ no x/× prefix) */}
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-[44px] font-semibold leading-none text-[rgb(var(--xpot-gold-2))]">
                {prize ?? '—'}
              </div>
              <div className="text-xs text-slate-400">XPOT</div>
            </div>

            {/* CLAIMED DATE (✅ date only, no time) */}
            <div className="mt-2 text-xs text-slate-400">
              {claimedLabel ? (
                <>
                  <span className="mr-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">Claimed</span>
                  <span className="text-slate-300">{claimedLabel}</span>
                </>
              ) : (
                <span className="text-slate-500">Claim time pending</span>
              )}
            </div>

            {/* WINNER IDENTITY (✅ use XAccountIdentity component) */}
            <div className="mt-4">
              {xHref ? (
                <a href={xHref} target="_blank" rel="noopener noreferrer" className="block">
                  <XAccountIdentity
                    name={winnerName}
                    handle={winnerHandle}
                    avatarUrl={winner?.avatarUrl}
                    verified={Boolean(winner?.verified)}
                    subtitle={winner?.kind === 'BONUS' ? 'Bonus winner' : null}
                  />
                </a>
              ) : (
                <div className="block">
                  <XAccountIdentity
                    name={winnerName}
                    handle={winnerHandle}
                    avatarUrl={winner?.avatarUrl}
                    verified={Boolean(winner?.verified)}
                    subtitle={winner?.kind === 'BONUS' ? 'Bonus winner' : null}
                  />
                </div>
              )}
            </div>

            {/* BOTTOM NOTE (✅ make it obvious there are more winners) */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">See more winners</div>
                <div className="mt-1 text-xs text-slate-300">
                  Full archive, TX links and history on the winners page.
                </div>
              </div>
              <Link
                href={ROUTE_WINNERS}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                Open winners
              </Link>
            </div>
          </div>

          {/* ENTRIES */}
          <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <Users className="h-4 w-4 text-sky-300" />
                Entries
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => setView('bubbles')}
                  className={cx(
                    'rounded-full px-3 py-1 text-xs',
                    view === 'bubbles' ? 'bg-white/10 text-white' : 'text-slate-400',
                  )}
                >
                  Bubbles
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cx(
                    'rounded-full px-3 py-1 text-xs',
                    view === 'list' ? 'bg-white/10 text-white' : 'text-slate-400',
                  )}
                >
                  List
                </button>
              </div>
            </div>

            {view === 'bubbles' ? (
              <BubbleEntrants entries={clean} />
            ) : (
              <div className="space-y-2">
                {clean.slice(0, 7).map((e, i) => (
                  <EntryLine key={normalizeHandle(e.handle)} e={e} idx={i} />
                ))}
              </div>
            )}

            {/* Optional: subtle footer for entries count */}
            <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
              <span>{clean.length ? `${clean.length} unique entrants` : 'No entrants yet'}</span>
              <Link href={ROUTE_HUB} className="text-slate-300 hover:text-white">
                Claim in the hub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
