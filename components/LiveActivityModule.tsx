'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crown, ExternalLink, Sparkles, Users } from 'lucide-react';

/* ======================================================
   TYPES (TOP-LEVEL EXPORTS — REQUIRED FOR BUILD)
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

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

function normalizeHandle(h?: string | null) {
  if (!h) return '@unknown';
  return h.startsWith('@') ? h : `@${h}`;
}

function toXProfileUrl(handle: string) {
  return `https://x.com/${handle.replace('@', '')}`;
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

function formatDateTime(iso?: string | null) {
  const ms = safeTimeMs(iso);
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(ms));
}

function formatXpot(w: LiveWinnerRow | null) {
  const v = w?.amountXpot ?? w?.amount;
  if (!v) return null;
  return Math.round(v).toLocaleString('en-US');
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
    `https://unavatar.io/twitter/${clean}?cache=${Math.floor(
      Date.now() / (6 * 60 * 60 * 1000),
    )}`;

  return (
    <div
      className="relative rounded-full overflow-hidden bg-white/5 ring-1 ring-white/15"
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
    const r = anchor.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.bottom + 10 });
  }, [open, anchor]);

  if (!open || !pos) return null;

  return createPortal(
    <div
      className="fixed z-[9999]"
      style={{ left: pos.x, top: pos.y, transform: 'translateX(-50%)' }}
    >
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
        <div className="rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl p-3 shadow-2xl w-[260px]">
          <div className="flex gap-3">
            <Avatar handle={handle} src={avatarUrl} size={42} />
            <div className="min-w-0">
              <div className="font-semibold text-sm text-white truncate">{handle}</div>
              {name && <div className="text-xs text-slate-400 truncate">{name}</div>}
              {meta && <div className="text-[10px] text-slate-500 mt-1">{meta}</div>}
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
      <div className="flex items-center gap-3 min-w-0">
        <AvatarTooltip
          handle={h}
          name={e.name}
          avatarUrl={e.avatarUrl}
          meta={e.createdAt ? `Madrid ${formatTime(e.createdAt)}` : null}
        />
        <div className="truncate text-sm font-semibold text-white">{h}</div>
      </div>
      <div className="text-[10px] text-slate-400">
        {idx === 0 ? 'just now' : 'today'}
      </div>
    </div>
  );
}

function BubbleEntrants({ entries }: { entries: EntryRow[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 py-4">
      {entries.slice(0, 24).map((e, i) => {
        const size = i === 0 ? 72 : i < 4 ? 56 : 44;
        const h = normalizeHandle(e.handle);
        return (
          <AvatarTooltip
            key={`${h}-${i}`}
            handle={h}
            name={e.name}
            avatarUrl={e.avatarUrl}
            meta={e.createdAt ? `Madrid ${formatTime(e.createdAt)}` : null}
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
  const clean = useMemo(() => {
    const seen = new Set<string>();
    return [...entries]
      .filter(e => {
        const k = `${e.handle}-${e.createdAt}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => safeTimeMs(b.createdAt) - safeTimeMs(a.createdAt));
  }, [entries]);

  const [view, setView] = useState<'bubbles' | 'list'>('bubbles');

  const prize = formatXpot(winner);
  const winnerHandle = normalizeHandle(winner?.handle ?? '');

  return (
    <section
      className={cx(
        'rounded-[32px] border border-white/10 bg-white/5 ring-1 ring-white/5 shadow-[0_60px_160px_rgba(0,0,0,0.6)]',
        className,
      )}
    >
      <div className="p-5 space-y-5">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-400">
              <Sparkles className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
              Live activity
            </div>
            <div className="text-lg font-semibold text-white mt-1">
              The XPOT stage
            </div>
          </div>

          <Link
            href={ROUTE_HUB}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
          >
            Enter today’s XPOT
          </Link>
        </div>

        {/* CONTENT */}
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
          {/* WINNER */}
          <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <Crown className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                Winner
              </div>
              {winner?.txUrl && (
                <a
                  href={winner.txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Proof ↗
                </a>
              )}
            </div>

            <div className="text-[44px] font-semibold text-[rgb(var(--xpot-gold-2))] leading-none">
              {prize ? `×${prize}` : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-1">XPOT</div>

            <div className="mt-4 flex items-center gap-3">
              <AvatarTooltip
                handle={winnerHandle}
                name={winner?.name}
                avatarUrl={winner?.avatarUrl}
                meta={winner?.drawDate ? formatDateTime(winner.drawDate) : null}
                size={48}
              />
              <div className="font-semibold text-white">{winnerHandle}</div>
            </div>
          </div>

          {/* ENTRIES */}
          <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <Users className="h-4 w-4 text-sky-300" />
                Entries
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setView('bubbles')}
                  className={cx(
                    'px-3 py-1 rounded-full text-xs',
                    view === 'bubbles'
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400',
                  )}
                >
                  Bubbles
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cx(
                    'px-3 py-1 rounded-full text-xs',
                    view === 'list'
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400',
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
                  <EntryLine key={`${e.handle}-${i}`} e={e} idx={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
