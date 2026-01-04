'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Trophy, Users } from 'lucide-react';

export type LiveWinnerRow = {
  id: string;
  handle: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  wallet?: string | null;

  amountXpot?: number | null;
  amount?: number | null;

  drawDate?: string | null; // ISO-ish
  txUrl?: string | null;

  isPaidOut?: boolean;
  kind?: 'MAIN' | 'BONUS' | null;
  label?: string | null;
};

export type EntryRow = {
  id?: string;
  createdAt?: string;
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
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

function sanitizeEntries(entries: EntryRow[]) {
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
      name: e.name ? String(e.name).trim() : '',
      createdAt: e.createdAt ?? '',
    });
  }

  out.sort((a, b) => safeTimeMs(b.createdAt) - safeTimeMs(a.createdAt));
  return out;
}

function formatEuMadrid(iso?: string | null) {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';

  // EU format: dd/mm/yyyy HH:mm (Madrid time)
  const d = new Date(ms);
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(d);
  } catch {
    // Fallback (still dd/mm/yyyy-ish)
    const pad2 = (n: number) => String(n).padStart(2, '0');
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
}

function shorten(s: string, left = 6, right = 6) {
  if (!s) return '';
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}…${s.slice(-right)}`;
}

/* ─────────────────────────────────────────────
   Tiny tooltip (portal) - works on desktop + tap-focus
───────────────────────────────────────────── */

function useBodyMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const mounted = useBodyMounted();
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
    <span className="relative inline-flex">
      <span
        ref={anchorRef}
        className="inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>

      {open && pos && mounted && typeof document !== 'undefined' && document.body
        ? createPortal(
            <div
              className="fixed z-[9999] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/85 px-3 py-2 text-[11px] leading-relaxed text-slate-200 shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
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

/* ─────────────────────────────────────────────
   Avatar
───────────────────────────────────────────── */

function Avatar({
  src,
  handle,
  name,
  size,
  verified,
}: {
  src?: string | null;
  handle: string;
  name?: string | null;
  size: number;
  verified?: boolean;
}) {
  const clean = normalizeHandle(handle).replace(/^@/, '');

  const resolvedSrc = useMemo(() => {
    if (src) return src;
    const cacheKey = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    return `https://unavatar.io/twitter/${encodeURIComponent(clean)}?cache=${cacheKey}`;
  }, [src, clean]);

  const tip = name ? `${normalizeHandle(handle)} - ${name}` : normalizeHandle(handle);

  const ring = verified
    ? 'ring-2 ring-[rgba(var(--xpot-gold),0.45)] shadow-[0_0_22px_rgba(245,158,11,0.18)]'
    : 'ring-1 ring-white/[0.14]';

  return (
    <Tooltip label={tip}>
      <span
        className={['relative shrink-0 overflow-hidden rounded-full', ring].join(' ')}
        style={{ width: size, height: size }}
        title={tip}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedSrc}
          alt={normalizeHandle(handle)}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_55%)]" />
      </span>
    </Tooltip>
  );
}

/* ─────────────────────────────────────────────
   Module
───────────────────────────────────────────── */

export default function LiveActivityModule({
  winner,
  entries,
  className = '',
}: {
  winner: LiveWinnerRow | null;
  entries: EntryRow[];
  className?: string;
}) {
  const list = useMemo(() => sanitizeEntries(entries), [entries]);
  const top = list.slice(0, 10);

  const winnerHandle = normalizeHandle(winner?.handle ?? '@unknown');
  const winnerName = winner?.name ? String(winner.name) : '';
  const winnerWhen = formatEuMadrid(winner?.drawDate ?? null);
  const prize = winner?.amountXpot ?? winner?.amount ?? null;

  return (
    <section
      className={[
        'relative overflow-hidden rounded-[32px]',
        'border border-white/10 bg-slate-950/18 ring-1 ring-white/[0.05]',
        'shadow-[0_40px_140px_rgba(0,0,0,0.55)]',
        className,
      ].join(' ')}
    >
      {/* lighter aura (less busy) */}
      <div className="pointer-events-none absolute -inset-28 opacity-70 blur-3xl bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.10),transparent_62%),radial-gradient(circle_at_84%_20%,rgba(16,185,129,0.10),transparent_62%),radial-gradient(circle_at_52%_0%,rgba(var(--xpot-gold),0.10),transparent_62%)]" />

      {/* header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
          <Users className="h-4 w-4 text-sky-200" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200">
            Live activity
          </span>
        </div>

        <div className="text-[12px] text-slate-400">
          Today&apos;s spotlight and who just entered
        </div>
      </div>

      {/* content - stacked on mobile, 2-col on md */}
      <div className="relative z-10 grid gap-4 px-5 pb-5 sm:px-6 sm:pb-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* Winner card (simplified) */}
        <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] ring-1 ring-white/[0.05]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.35),rgba(255,255,255,0.08),transparent)]" />

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
                <Trophy className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-100">
                  Latest winner
                </span>
              </div>

              {winner?.txUrl ? (
                <a
                  href={winner.txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] text-slate-200 hover:bg-white/[0.06] transition"
                  title="Open payout proof"
                >
                  Proof
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </a>
              ) : null}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Avatar
                src={winner?.avatarUrl}
                handle={winnerHandle}
                name={winnerName}
                size={44}
                verified={true}
              />

              <div className="min-w-0">
                <a
                  href={toXProfileUrl(winnerHandle)}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="truncate text-[14px] font-semibold text-slate-100 hover:text-white"
                  title="Open X profile"
                >
                  {winnerHandle}
                </a>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
                  {winnerName ? <span className="truncate">{winnerName}</span> : null}
                  {winnerWhen ? (
                    <>
                      <span className="opacity-60">•</span>
                      <span className="font-mono">{winnerWhen}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Prize
              </p>
              <p className="mt-2 font-mono text-[22px] font-semibold text-[rgb(var(--xpot-gold-2))]">
                {typeof prize === 'number' ? `×${prize.toLocaleString()}` : '×-'}
              </p>

              {winner?.wallet ? (
                <p className="mt-2 text-[12px] text-slate-400">
                  Wallet <span className="font-mono text-slate-300">{shorten(String(winner.wallet), 8, 8)}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Entries (less busy + mobile friendly) */}
        <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] ring-1 ring-white/[0.05]">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
                <Users className="h-4 w-4 text-sky-200" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-100">
                  Entering now
                </span>
              </div>

              <span className="text-[12px] text-slate-400">
                {top.length ? `${top.length} recent` : 'No entries yet'}
              </span>
            </div>

            {/* Mobile: vertical list, Desktop: compact chips */}
            <div className="mt-4 md:hidden">
              <div className="grid gap-2">
                {top.map((e, idx) => {
                  const h = normalizeHandle(e.handle);
                  const when = formatEuMadrid(e.createdAt ?? null);

                  return (
                    <a
                      key={`${h}-${e.createdAt ?? ''}-${idx}`}
                      href={toXProfileUrl(h)}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-3 py-2 hover:bg-white/[0.06] transition"
                    >
                      <Avatar
                        src={e.avatarUrl}
                        handle={h}
                        name={e.name ?? ''}
                        verified={e.verified}
                        size={34}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-slate-100">{h}</div>
                        <div className="truncate text-[12px] text-slate-400">
                          {e.name ? e.name : ' '}
                          {when ? <span className="ml-2 font-mono opacity-80">{when}</span> : null}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-600" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 hidden md:block">
              <div className="min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center gap-2 pr-2">
                  {top.map((e, idx) => {
                    const h = normalizeHandle(e.handle);
                    return (
                      <a
                        key={`${h}-${e.createdAt ?? ''}-${idx}`}
                        href={toXProfileUrl(h)}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-2 hover:bg-white/[0.06] transition"
                      >
                        <Avatar
                          src={e.avatarUrl}
                          handle={h}
                          name={e.name ?? ''}
                          verified={e.verified}
                          size={30}
                        />
                        <span className="max-w-[160px] truncate text-[12px] font-semibold text-slate-100">
                          {h}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>

              <p className="mt-3 text-[12px] text-slate-500">
                Tap an avatar to see tooltip and open on X.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
