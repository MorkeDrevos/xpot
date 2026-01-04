// components/LiveActivityModule.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, ExternalLink, Users } from 'lucide-react';

import type { EntryRow } from '@/components/EnteringStageLive';

export type LiveWinnerRow = {
  id: string;
  handle: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  wallet: string | null;

  amount?: number | null;
  amountXpot?: number | null;

  drawDate: string | null; // ISO string
  txUrl?: string | null;
  isPaidOut?: boolean;

  kind?: 'MAIN' | 'BONUS' | null;
  label?: string | null;
};

function normalizeHandle(h: string | null | undefined) {
  const s = String(h ?? '').trim();
  if (!s) return '@unknown';
  return s.startsWith('@') ? s : `@${s}`;
}

function toXProfileUrl(handle: string) {
  const h = normalizeHandle(handle).replace(/^@/, '');
  return `https://x.com/${encodeURIComponent(h)}`;
}

function safeTimeMs(iso?: string | null) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function formatEuDateTime(iso?: string | null) {
  const ms = safeTimeMs(iso);
  if (!ms) return '';
  // EU style + 24h clock
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(ms));
}

function formatEuTime(iso?: string | null) {
  const ms = safeTimeMs(iso);
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(ms));
}

function formatXpotAmount(winner: LiveWinnerRow | null) {
  const raw =
    typeof winner?.amountXpot === 'number'
      ? winner?.amountXpot
      : typeof winner?.amount === 'number'
        ? winner?.amount
        : null;

  if (!raw || raw <= 0) return null;

  // XPOT is usually shown as integer amount
  const n = Math.round(raw);
  return n.toLocaleString('en-US');
}

function shorten(s: string, left = 6, right = 6) {
  if (!s) return '';
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}…${s.slice(-right)}`;
}

function Avatar({
  src,
  handle,
  size,
}: {
  src?: string | null;
  handle: string;
  size: number;
}) {
  const clean = normalizeHandle(handle).replace(/^@/, '');
  const resolvedSrc = useMemo(() => {
    if (src) return src;
    const cacheKey = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    return `https://unavatar.io/twitter/${encodeURIComponent(clean)}?cache=${cacheKey}`;
  }, [src, clean]);

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-white/15 bg-white/5"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={normalizeHandle(handle)}
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_55%)]" />
    </div>
  );
}

function useIsTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const onFirstTouch = () => setTouch(true);
    window.addEventListener('touchstart', onFirstTouch, { passive: true, once: true });
    return () => window.removeEventListener('touchstart', onFirstTouch as any);
  }, []);
  return touch;
}

/**
 * Avatar tooltip (back).
 * - Desktop: hover/focus
 * - Mobile: tap to toggle
 */
function AvatarTooltip({
  handle,
  name,
  meta,
  avatarUrl,
  href,
  size = 34,
}: {
  handle: string;
  name?: string | null;
  meta?: string | null;
  avatarUrl?: string | null;
  href: string;
  size?: number;
}) {
  const isTouch = useIsTouch();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const labelTop = normalizeHandle(handle);
  const labelSub = name ? String(name).trim() : '';
  const labelMeta = meta ? String(meta).trim() : '';

  const closeSoon = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const onEnter = () => {
    if (isTouch) return;
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const onLeave = () => {
    if (isTouch) return;
    closeSoon();
  };

  const onToggleTouch = (e: React.MouseEvent) => {
    if (!isTouch) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(v => !v);
  };

  return (
    <span className="relative inline-flex">
      <a
        href={href}
        target="_blank"
        rel="nofollow noopener noreferrer"
        className="inline-flex items-center"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        onClick={onToggleTouch}
        aria-label={`Open ${labelTop} on X`}
      >
        <Avatar src={avatarUrl} handle={handle} size={size} />
      </a>

      {open ? (
        <div
          className={[
            'absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2',
            'min-w-[220px] max-w-[280px]',
            'rounded-2xl border border-white/10 bg-black/85 backdrop-blur',
            'px-3 py-2 shadow-[0_30px_90px_rgba(0,0,0,0.6)]',
          ].join(' ')}
          onMouseEnter={() => {
            if (isTouch) return;
            if (closeTimer.current) window.clearTimeout(closeTimer.current);
          }}
          onMouseLeave={onLeave}
          role="tooltip"
        >
          <div className="flex items-start gap-3">
            <Avatar src={avatarUrl} handle={handle} size={32} />
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold text-slate-100">{labelTop}</div>
              {labelSub ? <div className="truncate text-[11px] text-slate-300/80">{labelSub}</div> : null}
              {labelMeta ? <div className="mt-1 text-[10px] text-slate-400">{labelMeta}</div> : null}
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-100/90">
                Open on X <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </span>
  );
}

function cleanEntries(entries: EntryRow[]) {
  const arr = Array.isArray(entries) ? entries : [];
  const out: EntryRow[] = [];
  const seen = new Set<string>();

  for (const e of arr) {
    if (!e?.handle) continue;
    const h = normalizeHandle(e.handle);
    const key = `${h}-${e.createdAt ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...e,
      handle: h,
      createdAt: e.createdAt ?? '',
      name: e.name ? String(e.name).trim() : '',
    });
  }

  out.sort((a, b) => safeTimeMs(b.createdAt) - safeTimeMs(a.createdAt));
  return out;
}

export default function LiveActivityModule({
  winner,
  entries,
  className = '',
}: {
  winner: LiveWinnerRow | null;
  entries: EntryRow[];
  className?: string;
}) {
  const list = useMemo(() => cleanEntries(entries), [entries]);
  const top = list.slice(0, 8);

  const winnerHandle = normalizeHandle(winner?.handle ?? '');
  const winnerName = winner?.name ? String(winner.name).trim() : '';
  const winnerWhen = formatEuDateTime(winner?.drawDate ?? null);
  const winnerPrize = formatXpotAmount(winner);
  const winnerHref = toXProfileUrl(winnerHandle);

  const ROUTE_HUB = '/hub';

  return (
    <section
      className={[
        'relative overflow-hidden rounded-[28px] sm:rounded-[32px]',
        'border border-white/10 bg-white/[0.02] ring-1 ring-white/[0.05]',
        'shadow-[0_40px_140px_rgba(0,0,0,0.6)]',
        className,
      ].join(' ')}
    >
      {/* subtle top seam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.34),rgba(255,255,255,0.06),rgba(56,189,248,0.18),transparent)]" />
      {/* calm aura (less busy than before) */}
      <div className="pointer-events-none absolute -inset-28 opacity-65 blur-3xl bg-[radial-gradient(circle_at_14%_18%,rgba(var(--xpot-gold),0.10),transparent_60%),radial-gradient(circle_at_86%_22%,rgba(56,189,248,0.08),transparent_62%)]" />

      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">Live activity</p>
            <h3 className="mt-2 text-pretty text-[15px] font-semibold text-slate-50">
              Spotlight winner and recent entries
            </h3>
            <p className="mt-1 text-[12px] text-slate-400">Simple, fast, mobile-first.</p>
          </div>

          <Link
            href={ROUTE_HUB}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
          >
            Claim entry
            <ExternalLink className="h-4 w-4 text-slate-500" />
          </Link>
        </div>

        {/* Content grid */}
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* Spotlight (winner) */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.05]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.32),transparent)]" />

            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                  <Crown className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                  Spotlight
                </span>

                {winner?.txUrl ? (
                  <a
                    href={winner.txUrl}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-white/[0.05] transition"
                    title="Open on-chain proof"
                  >
                    Proof <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500">Proof pending</span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <AvatarTooltip
                  handle={winnerHandle}
                  name={winnerName}
                  meta={winnerWhen ? `Madrid time: ${winnerWhen}` : null}
                  avatarUrl={winner?.avatarUrl ?? null}
                  href={winnerHref}
                  size={42}
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <a
                      href={winnerHref}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="truncate text-[16px] font-semibold text-slate-100"
                      title={winnerHandle}
                    >
                      {winnerHandle}
                    </a>
                    <ExternalLink className="h-4 w-4 text-slate-600" />
                  </div>
                  {winnerName ? <div className="truncate text-[12px] text-slate-400">{winnerName}</div> : null}
                  {winnerWhen ? <div className="mt-1 text-[11px] text-slate-500">{winnerWhen}</div> : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Prize</div>
                  <div className="mt-1 text-[16px] font-semibold text-[rgb(var(--xpot-gold-2))]">
                    {winnerPrize ? `×${winnerPrize}` : '—'}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Wallet</div>
                  <div className="mt-1 truncate font-mono text-[12px] text-slate-200">
                    {winner?.wallet ? shorten(winner.wallet, 8, 8) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent entries (simple list, mobile friendly) */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.05]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.24),transparent)]" />

            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                  <Users className="h-4 w-4 text-sky-200" />
                  Entered
                </span>
                <span className="text-[11px] text-slate-500">{list.length ? `${list.length} today` : '—'}</span>
              </div>

              <div className="mt-4 space-y-2">
                {top.length ? (
                  top.map((e, idx) => {
                    const handle = normalizeHandle(e.handle);
                    const href = toXProfileUrl(handle);
                    const t = e.createdAt ? formatEuTime(e.createdAt) : '';
                    const meta = t ? `Madrid time: ${t}` : null;

                    return (
                      <div
                        key={`${handle}-${e.createdAt ?? idx}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <AvatarTooltip
                            handle={handle}
                            name={e.name ?? ''}
                            meta={meta}
                            avatarUrl={e.avatarUrl ?? null}
                            href={href}
                            size={34}
                          />

                          <div className="min-w-0">
                            <a
                              href={href}
                              target="_blank"
                              rel="nofollow noopener noreferrer"
                              className="truncate text-[13px] font-semibold text-slate-100"
                              title={handle}
                            >
                              {handle}
                            </a>
                            {e.name ? <div className="truncate text-[11px] text-slate-400">{e.name}</div> : null}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {t ? <div className="text-[11px] font-semibold text-slate-200">{t}</div> : null}
                          <div className="text-[10px] text-slate-500">today</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-[12px] text-slate-400">
                    No entries yet.
                  </div>
                )}
              </div>

              <div className="mt-4 text-[11px] text-slate-500">
                Tip: hover (desktop) or tap (mobile) avatars to see details.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
