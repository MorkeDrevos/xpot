// components/LiveActivityModule.tsx
'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, ExternalLink, Users } from 'lucide-react';

/**
 * ✅ Export EntryRow from HERE because HomePageClient imports it from LiveActivityModule.
 * Keep it compatible with your public entries APIs.
 */
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

  drawDate: string | null; // ISO string
  txUrl?: string | null;
  isPaidOut?: boolean;

  kind?: 'MAIN' | 'BONUS' | null;
  label?: string | null;

  verified?: boolean;
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
      ? winner.amountXpot
      : typeof winner?.amount === 'number'
        ? winner.amount
        : null;

  if (!raw || raw <= 0) return null;
  return Math.round(raw).toLocaleString('en-US');
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

/**
 * Premium popover that NEVER goes behind panels:
 * - Renders in a portal to document.body
 * - Desktop: hover/focus
 * - Mobile: tap to toggle (tap again closes, link inside opens X)
 */
function ProfilePopover({
  handle,
  name,
  avatarUrl,
  verified,
  metaRight,
  href,
  size = 36,
}: {
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  verified?: boolean;
  metaRight?: string | null; // e.g. "15:08"
  href: string;
  size?: number;
}) {
  const isTouch = useIsTouch();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const anchorRef = useRef<HTMLAnchorElement | null>(null);
  const closeTimer = useRef<number | null>(null);

  const labelTop = normalizeHandle(handle);
  const labelSub = name ? String(name).trim() : '';

  const updatePos = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      left: r.left + r.width / 2,
      top: r.bottom + 10,
    });
  };

  const openNow = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    updatePos();
    setOpen(true);
  };

  const closeSoon = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    if (!open) return;

    const onScroll = () => updatePos();
    const onResize = () => updatePos();

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open || !isTouch) return;

    const onDoc = (e: MouseEvent) => {
      const a = anchorRef.current;
      if (!a) return;
      if (a.contains(e.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener('click', onDoc, true);
    return () => document.removeEventListener('click', onDoc, true);
  }, [open, isTouch]);

  const onEnter = () => {
    if (isTouch) return;
    openNow();
  };

  const onLeave = () => {
    if (isTouch) return;
    closeSoon();
  };

  const onToggleTouch = (e: React.MouseEvent) => {
    if (!isTouch) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(v => {
      const next = !v;
      if (next) updatePos();
      return next;
    });
  };

  const popover =
    open && pos && typeof document !== 'undefined' && document.body
      ? createPortal(
          <div
            className="fixed z-[9999] -translate-x-1/2"
            style={{ left: pos.left, top: pos.top }}
            role="tooltip"
            onMouseEnter={() => {
              if (isTouch) return;
              if (closeTimer.current) window.clearTimeout(closeTimer.current);
            }}
            onMouseLeave={onLeave}
          >
            <div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-black/80 backdrop-blur-xl shadow-[0_30px_110px_rgba(0,0,0,0.75)]">
              <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(var(--xpot-gold),0.18),transparent_60%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.12),transparent_60%)]" />
              <div className="relative px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <Avatar src={avatarUrl} handle={handle} size={34} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-[12px] font-semibold text-slate-50">{labelTop}</div>
                      {verified ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                          verified
                        </span>
                      ) : null}
                      {metaRight ? (
                        <span className="ml-auto text-[10px] font-semibold text-slate-400">{metaRight}</span>
                      ) : null}
                    </div>

                    {labelSub ? <div className="truncate text-[11px] text-slate-300/80">{labelSub}</div> : null}

                    <a
                      href={href}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
                    >
                      Open on X <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <a
        ref={anchorRef}
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
      {popover}
    </>
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
  const top = list.slice(0, 6);

  const winnerHandle = normalizeHandle(winner?.handle ?? '');
  const winnerName = winner?.name ? String(winner.name).trim() : '';
  const winnerPrize = formatXpotAmount(winner);
  const winnerHref = toXProfileUrl(winnerHandle);

  const ROUTE_HUB = '/hub';

  return (
    <section
      className={[
        'relative overflow-hidden rounded-[30px] sm:rounded-[36px]',
        'border border-white/10 bg-white/[0.02] ring-1 ring-white/[0.06]',
        'shadow-[0_50px_170px_rgba(0,0,0,0.65)]',
        className,
      ].join(' ')}
    >
      {/* premium seam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.40),rgba(255,255,255,0.08),rgba(56,189,248,0.22),transparent)]" />
      {/* calm aura */}
      <div className="pointer-events-none absolute -inset-32 opacity-75 blur-3xl bg-[radial-gradient(circle_at_14%_22%,rgba(var(--xpot-gold),0.12),transparent_60%),radial-gradient(circle_at_86%_22%,rgba(56,189,248,0.10),transparent_62%),radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.10),transparent_60%)]" />

      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">Live activity</p>
            <h3 className="mt-2 text-pretty text-[15px] font-semibold text-slate-50">
              Today&apos;s spotlight and who just entered
            </h3>
          </div>

          <Link
            href={ROUTE_HUB}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
          >
            Claim entry <ExternalLink className="h-4 w-4 text-slate-500" />
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* WINNER PANEL (premium promo) */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.05]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.36),transparent)]" />
            <div className="pointer-events-none absolute -inset-24 opacity-80 blur-3xl bg-[radial-gradient(circle_at_18%_25%,rgba(var(--xpot-gold),0.18),transparent_60%),radial-gradient(circle_at_82%_22%,rgba(56,189,248,0.10),transparent_62%)]" />

            <div className="relative p-4 sm:p-6">
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
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
                    title="Open on-chain proof"
                  >
                    Proof <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500">Proof pending</span>
                )}
              </div>

              <div className="mt-5 flex items-center gap-4">
                <ProfilePopover
                  handle={winnerHandle}
                  name={winnerName}
                  avatarUrl={winner?.avatarUrl ?? null}
                  verified={Boolean((winner as any)?.verified)}
                  href={winnerHref}
                  size={46}
                />

                <div className="min-w-0">
                  <a
                    href={winnerHref}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-2 truncate text-[16px] font-semibold text-slate-100 hover:text-white transition"
                    title={winnerHandle}
                  >
                    {winnerHandle}
                    <ExternalLink className="h-4 w-4 text-slate-600" />
                  </a>
                  {winnerName ? <div className="mt-1 truncate text-[12px] text-slate-400">{winnerName}</div> : null}
                </div>
              </div>

              {/* PROMO AMOUNT BLOCK */}
              <div className="mt-5 relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/[0.05]">
                <div className="pointer-events-none absolute -inset-20 opacity-85 blur-3xl bg-[radial-gradient(circle_at_20%_10%,rgba(var(--xpot-gold),0.22),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(56,189,248,0.10),transparent_60%)]" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-300/80">
                      Winner just took home
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                      Daily reward
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-balance font-mono text-[28px] font-semibold tracking-tight text-[rgb(var(--xpot-gold-2))] sm:text-[34px]">
                        {winnerPrize ? `${winnerPrize} XPOT` : '— XPOT'}
                      </div>
                      <div className="mt-1 text-[12px] text-slate-400">
                        Published handle-first and paid on-chain
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                      <Crown className="h-5 w-5 text-[rgb(var(--xpot-gold-2))]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* remove wallet address entirely */}
            </div>
          </div>

          {/* ENTRIES PANEL */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.05]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.28),transparent)]" />
            <div className="pointer-events-none absolute -inset-24 opacity-75 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.14),transparent_60%),radial-gradient(circle_at_80%_30%,rgba(139,92,246,0.10),transparent_60%)]" />

            <div className="relative p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                  <Users className="h-4 w-4 text-sky-200" />
                  Entering now
                </span>
                <span className="text-[11px] text-slate-500">{list.length ? `${list.length} today` : '—'}</span>
              </div>

              <div className="mt-4 space-y-2">
                {top.length ? (
                  top.map((e, idx) => {
                    const handle = normalizeHandle(e.handle);
                    const href = toXProfileUrl(handle);
                    const t = e.createdAt ? formatEuTime(e.createdAt) : '';

                    return (
                      <div
                        key={`${handle}-${e.createdAt ?? idx}`}
                        className="group flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.02] px-3 py-2 hover:bg-white/[0.04] transition"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <ProfilePopover
                            handle={handle}
                            name={e.name ?? ''}
                            avatarUrl={e.avatarUrl ?? null}
                            verified={Boolean((e as any)?.verified)}
                            metaRight={t || null}
                            href={href}
                            size={34}
                          />

                          <div className="min-w-0">
                            <a
                              href={href}
                              target="_blank"
                              rel="nofollow noopener noreferrer"
                              className="inline-flex items-center gap-2 truncate text-[13px] font-semibold text-slate-100"
                              title={handle}
                            >
                              {handle}
                              <ExternalLink className="h-3.5 w-3.5 text-slate-700 group-hover:text-slate-500 transition" />
                            </a>
                            {e.name ? <div className="truncate text-[11px] text-slate-400">{e.name}</div> : null}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {t ? <div className="text-[11px] font-semibold text-slate-200">{t}</div> : null}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.02] px-3 py-3 text-[12px] text-slate-400">
                    No entries yet.
                  </div>
                )}
              </div>

              {/* ✅ remove all the ugly helper text lines */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
