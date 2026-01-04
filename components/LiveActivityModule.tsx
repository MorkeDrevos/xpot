'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Users } from 'lucide-react';

export type EntryRow = {
  id?: string;
  createdAt?: string;
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  verified?: boolean;
};

type Variant = 'ultra' | 'ticker' | 'vip';

function normalizeHandle(h: string | null | undefined) {
  const s = String(h ?? '').trim();
  if (!s) return '@unknown';
  return s.startsWith('@') ? s : `@${s}`;
}

function toXProfileUrl(handle: string) {
  return `https://x.com/${encodeURIComponent(normalizeHandle(handle).replace(/^@/, ''))}`;
}

function safeTimeMs(iso?: string) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function makeKey(e: EntryRow, idx: number) {
  const h = normalizeHandle(e.handle);
  const t = e.createdAt ?? '';
  return e.id ? String(e.id) : `${h}-${t}-${idx}`;
}

function sanitize(entries: EntryRow[]) {
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

/** EU time format (dd/mm/yyyy, 24h). Uses Madrid timezone for XPOT consistency. */
function formatEuTime(iso?: string) {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return '';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(t));
  } catch {
    // fallback: still EU-ish without TZ guarantees
    return new Date(t).toLocaleString('en-GB', { hour12: false });
  }
}

function useBodyMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function Avatar({
  src,
  label,
  verified,
  size,
}: {
  src?: string | null;
  label: string;
  verified?: boolean;
  size: number;
}) {
  const handle = normalizeHandle(label).replace(/^@/, '');

  const resolvedSrc = useMemo(() => {
    if (src) return src;
    const cacheKey = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    return `https://unavatar.io/twitter/${encodeURIComponent(handle)}?cache=${cacheKey}`;
  }, [src, handle]);

  return (
    <div
      className={[
        'relative shrink-0 overflow-hidden rounded-full',
        verified
          ? 'ring-2 ring-[rgba(var(--xpot-gold),0.45)] shadow-[0_0_26px_rgba(245,158,11,0.22)]'
          : 'ring-1 ring-white/[0.14]',
      ].join(' ')}
      style={{ width: size, height: size }}
      title={normalizeHandle(label)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={normalizeHandle(label)}
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />

      {/* soft gloss */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
    </div>
  );
}

type TooltipPos = { left: number; top: number };

function useIsTouch() {
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia?.('(hover: none), (pointer: coarse)');
    const apply = () => setTouch(Boolean(mq?.matches));
    apply();

    if (!mq) return;
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  return touch;
}

export default function EnteringStageLive({
  entries,
  className = '',
  label = 'Entering the stage',
  embedded = false,
  variant = 'ultra',
  avatarSize = 42,
  max = 10,
}: {
  entries: EntryRow[];
  className?: string;
  label?: string;
  embedded?: boolean;
  variant?: Variant;
  avatarSize?: number;
  max?: number;
}) {
  const reduceMotion = useReducedMotion();
  const mounted = useBodyMounted();
  const isTouch = useIsTouch();

  const list = useMemo(() => sanitize(entries), [entries]);
  const row = list.slice(0, max);

  const Outer = embedded ? 'div' : 'section';

  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const anchorRef = useRef<Record<string, HTMLAnchorElement | null>>({});

  // Close tooltip on scroll/resize
  useEffect(() => {
    if (!openKey) return;

    const update = () => {
      const el = openKey ? anchorRef.current[openKey] : null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ left: r.left + r.width / 2, top: r.bottom + 18 }); // ✅ lower
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [openKey]);

  // Click outside closes (nice on mobile)
  useEffect(() => {
    if (!openKey) return;

    const onDown = (ev: MouseEvent | TouchEvent) => {
      const key = openKey;
      const el = key ? anchorRef.current[key] : null;
      const t = ev.target as Node | null;
      if (!el || !t) return;
      if (el.contains(t)) return;
      setOpenKey(null);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown as any);
    };
  }, [openKey]);

  return (
    <Outer
      className={[
        'relative overflow-hidden rounded-[22px]',
        embedded
          ? ''
          : 'border border-white/10 bg-slate-950/18 ring-1 ring-white/[0.05] shadow-[0_30px_140px_rgba(0,0,0,0.6)]',
        className,
      ].join(' ')}
    >
      {/* ambient aura */}
      <div className="pointer-events-none absolute -inset-24 opacity-55 blur-3xl bg-[radial-gradient(circle_at_20%_40%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(circle_at_80%_50%,rgba(16,185,129,0.10),transparent_62%),radial-gradient(circle_at_50%_120%,rgba(var(--xpot-gold),0.10),transparent_60%)]" />

      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* label */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
          <Users className="h-4 w-4 text-sky-200" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200">
            {label}
          </span>
        </div>

        {/* runway */}
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-3 pr-6">
            <AnimatePresence initial={false}>
              {row.map((e, idx) => {
                const key = makeKey(e, idx);
                const handle = normalizeHandle(e.handle);
                const when = formatEuTime(e.createdAt);
                const displayName = (e.name ?? '').trim();

                const isOpen = openKey === key;

                return (
                  <motion.a
                    key={key}
                    ref={el => {
                      anchorRef.current[key] = el;
                    }}
                    href={toXProfileUrl(handle)}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className={[
                      'group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2',
                      'hover:bg-white/[0.045] transition',
                      isOpen ? 'bg-white/[0.05]' : '',
                    ].join(' ')}
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, filter: 'blur(6px)' }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(6px)' }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    onMouseEnter={() => {
                      if (isTouch) return;
                      setOpenKey(key);
                    }}
                    onMouseLeave={() => {
                      if (isTouch) return;
                      setOpenKey(null);
                    }}
                    onFocus={() => setOpenKey(key)}
                    onBlur={() => setOpenKey(null)}
                    onClick={ev => {
                      // ✅ mobile-friendly: first tap opens tooltip, second tap follows link
                      if (!isTouch) return;
                      if (openKey !== key) {
                        ev.preventDefault();
                        setOpenKey(key);
                      }
                    }}
                  >
                    <Avatar src={e.avatarUrl} label={handle} verified={e.verified} size={avatarSize} />

                    <div className="min-w-0 leading-tight">
                      <div className="truncate text-[14px] font-semibold text-slate-100">{handle}</div>
                      {displayName ? (
                        <div className="truncate text-[12px] text-slate-400">{displayName}</div>
                      ) : null}
                    </div>

                    {/* Tooltip (portal) */}
                    {mounted &&
                    isOpen &&
                    pos &&
                    typeof document !== 'undefined' &&
                    document.body ? (
                      createPortal(
                        <div
                          className="fixed z-[9999] -translate-x-1/2 rounded-2xl bg-black/70 px-3 py-2 text-[11px] leading-tight text-slate-100 shadow-[0_30px_100px_rgba(0,0,0,0.65)] backdrop-blur-md"
                          style={{ left: pos.left, top: pos.top }}
                          role="tooltip"
                        >
                          {displayName ? (
                            <div className="truncate text-[12px] font-semibold text-white">{displayName}</div>
                          ) : null}
                          <div className="mt-0.5 truncate font-mono text-[11px] text-slate-200">{handle}</div>
                          {when ? (
                            <div className="mt-1 text-[10px] text-slate-300/80">Entered {when}</div>
                          ) : null}
                          <div className="mt-1 text-[10px] text-slate-300/70">Tap again to open X</div>
                        </div>,
                        document.body,
                      )
                    ) : null}
                  </motion.a>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Outer>
  );
}
