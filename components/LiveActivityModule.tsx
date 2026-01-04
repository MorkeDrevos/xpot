// components/LiveActivityModule.tsx
'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, ExternalLink, Sparkles, Users } from 'lucide-react';

// ✅ Re-export EntryRow so HomePageClient can import it from this module
export type { EntryRow } from '@/components/EnteringStageLive';
import type { EntryRow } from '@/components/EnteringStageLive';

export type LiveWinnerRow = {
  id: string;
  handle: string | null;
  name?: string | null;
  avatarUrl?: string | null;

  // kept for compatibility, but NOT displayed
  wallet: string | null;

  amount?: number | null;
  amountXpot?: number | null;

  drawDate: string | null; // ISO string
  txUrl?: string | null;

  kind?: 'MAIN' | 'BONUS' | null;
  label?: string | null;

  verified?: boolean;
};

const ROUTE_HUB = '/hub';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

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

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      if (e.target && el.contains(e.target as Node)) return;
      onClose();
    };

    window.addEventListener('mousedown', onDown, true);
    window.addEventListener('touchstart', onDown, true);
    return () => {
      window.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('touchstart', onDown, true);
    };
  }, [open, onClose]);

  return ref;
}

function Avatar({
  src,
  handle,
  size,
  ring = true,
}: {
  src?: string | null;
  handle: string;
  size: number;
  ring?: boolean;
}) {
  const clean = normalizeHandle(handle).replace(/^@/, '');
  const resolvedSrc = useMemo(() => {
    if (src) return src;
    const cacheKey = Math.floor(Date.now() / (8 * 60 * 60 * 1000));
    return `https://unavatar.io/twitter/${encodeURIComponent(clean)}?cache=${cacheKey}`;
  }, [src, clean]);

  return (
    <div
      className={cx(
        'relative shrink-0 overflow-hidden rounded-full bg-white/[0.06]',
        ring && 'ring-1 ring-white/15',
      )}
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.18),transparent_55%)]" />
    </div>
  );
}

/**
 * Premium tooltip:
 * - Desktop: hover/focus shows tooltip
 * - Mobile: first tap shows tooltip (prevents nav), second tap opens X
 */
function AvatarTooltip({
  handle,
  name,
  meta,
  avatarUrl,
  href,
  verified,
  size = 34,
}: {
  handle: string;
  name?: string | null;
  meta?: string | null;
  avatarUrl?: string | null;
  href: string;
  verified?: boolean;
  size?: number;
}) {
  const isTouch = useIsTouch();
  const [open, setOpen] = useState(false);
  const boxRef = useOutsideClose(open, () => setOpen(false));

  const labelTop = normalizeHandle(handle);
  const labelSub = name ? String(name).trim() : '';
  const labelMeta = meta ? String(meta).trim() : '';

  const hoverOpen = () => {
    if (isTouch) return;
    setOpen(true);
  };
  const hoverClose = () => {
    if (isTouch) return;
    setOpen(false);
  };

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isTouch) return;
    if (!open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    }
  };

  return (
    <div className="relative inline-flex" ref={boxRef}>
      <a
        href={href}
        target="_blank"
        rel="nofollow noopener noreferrer"
        className="group inline-flex items-center"
        onMouseEnter={hoverOpen}
        onMouseLeave={hoverClose}
        onFocus={hoverOpen}
        onBlur={hoverClose}
        onClick={onClick}
        aria-label={`Open ${labelTop} on X`}
      >
        <div className="relative">
          <Avatar src={avatarUrl} handle={handle} size={size} />
          <div className="pointer-events-none absolute -inset-1 rounded-full opacity-0 ring-2 ring-white/20 transition-opacity group-hover:opacity-100" />
        </div>
      </a>

      {open ? (
        <div
          className={cx(
            'absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2',
            'w-[268px] max-w-[80vw]',
            'rounded-[22px] border border-white/12 bg-slate-950/85 backdrop-blur-xl',
            'shadow-[0_30px_110px_rgba(0,0,0,0.75)]',
          )}
          role="tooltip"
          onMouseEnter={() => {
            if (isTouch) return;
            setOpen(true);
          }}
          onMouseLeave={hoverClose}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.28),rgba(255,255,255,0.06),rgba(56,189,248,0.16),transparent)]" />
          <div className="p-3">
            <div className="flex items-start gap-3">
              <Avatar src={avatarUrl} handle={handle} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-[12px] font-semibold text-slate-100">{labelTop}</div>
                  {verified ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                      verified
                    </span>
                  ) : null}
                </div>

                {labelSub ? <div className="truncate text-[11px] text-slate-300/80">{labelSub}</div> : null}
                {labelMeta ? <div className="mt-1 text-[10px] text-slate-400">{labelMeta}</div> : null}

                <div className="mt-3">
                  <a
                    href={href}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
                  >
                    Open on X <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </a>
                </div>

                {isTouch ? (
                  <div className="mt-2 text-[10px] text-slate-500">Tip: tap avatar again to open X.</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
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

function EntryRowLine({
  e,
  idx,
}: {
  e: EntryRow;
  idx: number;
}) {
  const handle = normalizeHandle(e.handle);
  const href = toXProfileUrl(handle);
  const t = e.createdAt ? formatEuTime(e.createdAt) : '';
  const meta = t ? `Madrid time: ${t}` : null;

  return (
    <div
      className={cx(
        'group flex items-center justify-between gap-3 rounded-2xl',
        'border border-white/10 bg-white/[0.02] px-3 py-2',
        'hover:bg-white/[0.04] hover:border-white/14 transition',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <AvatarTooltip
          handle={handle}
          name={e.name ?? ''}
          meta={meta}
          avatarUrl={e.avatarUrl ?? null}
          href={href}
          verified={Boolean((e as any)?.verified)}
          size={34}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <a
              href={href}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="truncate text-[13px] font-semibold text-slate-100"
              title={handle}
            >
              {handle}
            </a>
            <ExternalLink className="h-3.5 w-3.5 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          {e.name ? <div className="truncate text-[11px] text-slate-400">{e.name}</div> : null}
        </div>
      </div>

      <div className="shrink-0 text-right">
        {t ? <div className="text-[11px] font-semibold text-slate-200">{t}</div> : null}
        <div className="text-[10px] text-slate-500">{idx === 0 ? 'just now' : 'today'}</div>
      </div>
    </div>
  );
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
  const top = list.slice(0, 7);

  const winnerHandle = normalizeHandle(winner?.handle ?? '');
  const winnerName = winner?.name ? String(winner.name).trim() : '';
  const winnerWhen = formatEuDateTime(winner?.drawDate ?? null);
  const winnerPrize = formatXpotAmount(winner);
  const winnerHref = toXProfileUrl(winnerHandle);

  // little “club” numbers for vibe (non-critical)
  const entrantsToday = list.length;

  return (
    <section
      className={cx(
        'relative overflow-hidden rounded-[30px] sm:rounded-[40px]',
        'border border-white/10 bg-white/[0.02] ring-1 ring-white/[0.05]',
        'shadow-[0_60px_180px_rgba(0,0,0,0.65)]',
        className,
      )}
    >
      {/* top couture seam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.36),rgba(255,255,255,0.06),rgba(56,189,248,0.18),transparent)]" />
      {/* big aura */}
      <div className="pointer-events-none absolute -inset-40 opacity-60 blur-3xl bg-[radial-gradient(circle_at_18%_18%,rgba(var(--xpot-gold),0.14),transparent_58%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.12),transparent_62%),radial-gradient(circle_at_40%_90%,rgba(168,85,247,0.08),transparent_60%)]" />

      <div className="relative p-4 sm:p-6">
        {/* NEW HEADER: looks like a premium console plate */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-200">
                Live activity
              </span>
            </div>
            <div className="mt-2 text-pretty text-[15px] sm:text-[16px] font-semibold text-slate-50">
              The XPOT stage - winners and fresh entrants
            </div>
            <div className="mt-1 text-[12px] text-slate-400">
              Hover desktop. Tap mobile.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] text-slate-300">
              <Users className="h-4 w-4 text-sky-200" />
              <span className="font-semibold text-slate-100">{entrantsToday || 0}</span>
              <span className="text-slate-500">entered today</span>
            </div>

            <Link
              href={ROUTE_HUB}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
            >
              Enter today&apos;s XPOT
              <ExternalLink className="h-4 w-4 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* NEW LAYOUT: Winner Vault + Entry Stream */}
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          {/* WINNER VAULT (hero, not “boxy”) */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.05]">
            {/* vault shine */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.42),transparent)]" />
            <div className="pointer-events-none absolute -inset-10 opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(var(--xpot-gold),0.16),transparent_55%),radial-gradient(circle_at_70%_10%,rgba(56,189,248,0.10),transparent_50%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-30 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_35%,transparent_65%,rgba(255,255,255,0.04))]" />

            <div className="p-4 sm:p-5">
              {/* top line */}
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <Crown className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-200">
                    Winner vault
                  </span>
                </div>

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

              {/* big promo number row (the money shot) */}
              <div className="mt-4 rounded-[26px] border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.38em] text-slate-500">
                  WINNER JUST TOOK HOME
                </div>

                <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-[40px] sm:text-[48px] leading-none font-semibold tracking-tight text-[rgb(var(--xpot-gold-2))]">
                      {winnerPrize ? `×${winnerPrize}` : '—'}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">XPOT</div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/35 px-3 py-2 text-[11px] font-semibold text-slate-200">
                    <Sparkles className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                    published handle-first
                  </div>
                </div>
              </div>

              {/* identity strip */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/[0.02] px-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <AvatarTooltip
                    handle={winnerHandle}
                    name={winnerName}
                    meta={winnerWhen ? `Madrid time: ${winnerWhen}` : null}
                    avatarUrl={winner?.avatarUrl ?? null}
                    href={winnerHref}
                    size={46}
                    verified={Boolean((winner as any)?.verified)}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <a
                        href={winnerHref}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="truncate text-[15px] font-semibold text-slate-100"
                        title={winnerHandle}
                      >
                        {winnerHandle}
                      </a>
                      <ExternalLink className="h-4 w-4 text-slate-600" />
                    </div>
                    {winnerName ? <div className="truncate text-[12px] text-slate-400">{winnerName}</div> : null}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {winnerWhen ? <div className="text-[11px] font-semibold text-slate-200">{winnerWhen}</div> : null}
                  <div className="text-[10px] text-slate-500">Madrid time</div>
                </div>
              </div>

              {/* ultra subtle footer hint */}
              <div className="mt-4 text-[11px] text-slate-500">
                Tip: hover (desktop) or tap (mobile) avatars to preview profile.
              </div>
            </div>
          </div>

          {/* ENTRY STREAM (clean, premium list) */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.05]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.28),transparent)]" />
            <div className="pointer-events-none absolute -inset-10 opacity-55 bg-[radial-gradient(circle_at_80%_18%,rgba(56,189,248,0.14),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.07),transparent_55%)]" />

            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <Users className="h-4 w-4 text-sky-200" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-200">
                    Entry stream
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  {entrantsToday ? `${entrantsToday} today` : '—'}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {top.length ? (
                  top.map((e, idx) => <EntryRowLine key={`${e.handle}-${e.createdAt ?? idx}`} e={e} idx={idx} />)
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-[12px] text-slate-400">
                    No entries yet.
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">Fast, clean, mobile-first.</div>
                <Link
                  href={ROUTE_HUB}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-slate-100 hover:bg-white/[0.06] transition"
                >
                  Join now <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
