// components/EnteringStageLive.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  const h = normalizeHandle(handle).replace(/^@/, '');
  return `https://x.com/${encodeURIComponent(h)}`;
}

function safeTimeMs(iso?: string) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function makeKey(e: EntryRow, idx: number) {
  const h = normalizeHandle(e?.handle);
  const t = e?.createdAt ?? '';
  return e?.id ? String(e.id) : `${h}-${t}-${idx}`;
}

function useLocalHandle() {
  const [h, setH] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem('xpot_last_handle');
      setH(v ? normalizeHandle(v) : null);
    } catch {
      setH(null);
    }
  }, []);

  return h;
}

function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const check = () => {
      const canHover =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(hover: hover)').matches;
      const hasCoarse =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(pointer: coarse)').matches;

      setIsTouch(Boolean(!canHover && hasCoarse));
    };

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isTouch;
}

function sanitize(entries: EntryRow[]) {
  const arr = Array.isArray(entries) ? entries : [];
  const filtered = arr
    .filter(e => e && e.handle)
    .map(e => ({
      ...e,
      handle: normalizeHandle(e.handle),
      createdAt: e.createdAt ?? '',
      name: e.name ? String(e.name).trim() : '',
    }));

  const seen = new Set<string>();
  const out: EntryRow[] = [];
  for (const e of filtered) {
    const k = e.id ? `id:${e.id}` : `hc:${normalizeHandle(e.handle)}|${e.createdAt ?? ''}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }

  out.sort((a, b) => safeTimeMs(b.createdAt) - safeTimeMs(a.createdAt));
  return out;
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
  const handle = useMemo(() => normalizeHandle(label).replace(/^@/, '').trim(), [label]);

  const resolvedSrc = useMemo(() => {
    if (src) return src;
    if (!handle) return null;
    const cacheKey = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    return `https://unavatar.io/twitter/${encodeURIComponent(handle)}?cache=${cacheKey}`;
  }, [src, handle]);

  const [failed, setFailed] = useState(false);

  const initials = useMemo(() => {
    const s = handle || '';
    if (!s) return 'X';
    return s.slice(0, 2).toUpperCase();
  }, [handle]);

  const frame = verified
    ? 'border-[rgba(var(--xpot-gold),0.35)] ring-2 ring-[rgba(var(--xpot-gold),0.22)] shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.14),0_0_28px_rgba(245,158,11,0.10)]'
    : 'border-white/12 ring-1 ring-white/[0.08]';

  return (
    <div
      className={[
        'relative shrink-0 overflow-hidden rounded-full border bg-white/[0.035]',
        frame,
        verified ? 'xpot-verified-shimmer' : '',
      ].join(' ')}
      style={{ width: size, height: size }}
      title={normalizeHandle(label)}
    >
      {verified ? <span className="pointer-events-none absolute inset-0 xpot-verified-sheen" /> : null}

      {resolvedSrc && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt={normalizeHandle(label)}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-mono text-[11px] text-slate-200">
          {initials}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.06]" />
    </div>
  );
}

function MiniDot({
  src,
  label,
  verified,
}: {
  src?: string | null;
  label: string;
  verified?: boolean;
}) {
  const handle = useMemo(() => normalizeHandle(label).replace(/^@/, '').trim(), [label]);

  const resolvedSrc = useMemo(() => {
    if (src) return src;
    if (!handle) return null;
    const cacheKey = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    return `https://unavatar.io/twitter/${encodeURIComponent(handle)}?cache=${cacheKey}`;
  }, [src, handle]);

  const [failed, setFailed] = useState(false);

  const cls = verified
    ? 'border-[rgba(var(--xpot-gold),0.38)] ring-1 ring-[rgba(var(--xpot-gold),0.22)]'
    : 'border-white/14 ring-1 ring-white/[0.06]';

  return (
    <span
      className={[
        'relative inline-flex h-3.5 w-3.5 overflow-hidden rounded-full border bg-white/[0.04]',
        cls,
      ].join(' ')}
    >
      {resolvedSrc && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt={normalizeHandle(label)}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="h-full w-full bg-white/[0.05]" />
      )}
    </span>
  );
}

function ProfileHoverCard({ e, isMe }: { e: EntryRow; isMe: boolean }) {
  const handle = normalizeHandle(e.handle);
  const name = e.name ? String(e.name).trim() : '';

  return (
    <motion.div
      className={[
        'pointer-events-none absolute left-1/2 top-full z-30 mt-4 -translate-x-1/2',
        'w-[300px] overflow-hidden rounded-2xl border border-white/12 bg-slate-950/85 backdrop-blur-xl',
        'shadow-[0_40px_140px_rgba(0,0,0,0.75)]',
      ].join(' ')}
      initial={{ opacity: 0, y: 10, scale: 0.98, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 10, scale: 0.985, filter: 'blur(10px)' }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
    >
      <div className="h-px w-full bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.65),rgba(56,189,248,0.35),transparent)] opacity-80" />

      <div className="p-4 flex items-center gap-3">
        <Avatar src={e.avatarUrl} label={handle} verified={e.verified} size={54} />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-slate-100">{handle}</span>
            {isMe ? (
              <span className="rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                You
              </span>
            ) : null}
          </div>

          {name ? (
            <div className="truncate text-[13px] text-slate-400">{name}</div>
          ) : (
            <div className="text-[12px] text-slate-500">x.com profile</div>
          )}

          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-200">
            View profile on X
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TapSheet({
  open,
  onClose,
  entry,
  isMe,
}: {
  open: boolean;
  onClose: () => void;
  entry: EntryRow | null;
  isMe: boolean;
}) {
  const reduceMotion = useReducedMotion();

  const handle = entry ? normalizeHandle(entry.handle) : '@unknown';
  const name = entry?.name ? String(entry.name).trim() : '';
  const xUrl = entry ? toXProfileUrl(handle) : null;

  return (
    <AnimatePresence>
      {open && entry ? (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? undefined : { duration: 0.18 }}
            onClick={onClose}
          />

          <motion.div
            className={[
              'fixed inset-x-0 bottom-0 z-[90]',
              'rounded-t-[28px] border-t border-white/12 bg-slate-950/92 backdrop-blur-xl',
              'shadow-[0_-30px_120px_rgba(0,0,0,0.75)]',
            ].join(' ')}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={reduceMotion ? undefined : { duration: 0.2, ease: 'easeOut' }}
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-white/10 mt-3" />

            <div className="p-5">
              <div className="flex items-center gap-4">
                <Avatar src={entry.avatarUrl} label={handle} verified={entry.verified} size={64} />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-[16px] font-semibold text-slate-100">{handle}</div>
                    {isMe ? (
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                        You
                      </span>
                    ) : null}
                  </div>

                  {name ? (
                    <div className="truncate text-[13px] text-slate-400">{name}</div>
                  ) : (
                    <div className="text-[12px] text-slate-500">x.com profile</div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                {xUrl ? (
                  <a
                    href={xUrl}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.06] px-4 py-3 text-[13px] font-semibold text-slate-100 hover:bg-white/[0.10] transition"
                  >
                    Open on X
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] font-semibold text-slate-200 hover:bg-white/[0.06] transition"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 text-center text-[11px] text-slate-500">Tap outside to dismiss</div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default function EnteringStageLive({
  entries,
  className = '',
  label = 'Entering the stage',
  embedded = false,
  variant = 'ultra',
  avatarSize = 30,
  max = 18,
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
  const isTouch = useIsTouch();
  const localHandle = useLocalHandle();

  const list = useMemo(() => sanitize(entries), [entries]);
  const has = list.length > 0;

  const row = list.slice(0, max);
  const newest = row[0] ?? null;

  const newestKey = useMemo(() => (newest ? makeKey(newest, 0) : null), [newest]);
  const prevNewestKey = useRef<string | null>(null);
  const [newPulse, setNewPulse] = useState(false);

  const [sheetEntry, setSheetEntry] = useState<EntryRow | null>(null);

  useEffect(() => {
    if (!newestKey) return;
    if (prevNewestKey.current && prevNewestKey.current !== newestKey) {
      setNewPulse(true);
      const t = window.setTimeout(() => setNewPulse(false), reduceMotion ? 300 : 1200);
      return () => window.clearTimeout(t);
    }
    prevNewestKey.current = newestKey;
  }, [newestKey, reduceMotion]);

  useEffect(() => {
    if (!sheetEntry) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setSheetEntry(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetEntry]);

  const Outer = embedded ? 'div' : 'section';
  const outerClass = embedded
    ? ['relative', className].join(' ')
    : [
        'relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/18 ring-1 ring-white/[0.05]',
        'shadow-[0_30px_140px_rgba(0,0,0,0.60)]',
        className,
      ].join(' ');

  const sheetIsMe = useMemo(() => {
    if (!sheetEntry || !localHandle) return false;
    return normalizeHandle(localHandle) === normalizeHandle(sheetEntry.handle);
  }, [sheetEntry, localHandle]);

  return (
    <>
      <Outer className={outerClass}>
        <style jsx global>{`
          @keyframes xpotLiveDot {
            0% { opacity: 0.55; transform: scale(0.95); }
            55% { opacity: 1; transform: scale(1.06); }
            100% { opacity: 0.55; transform: scale(0.95); }
          }
          .xpot-live-dot { animation: xpotLiveDot 1.35s ease-in-out infinite; }

          @keyframes xpotAuraBreath {
            0% { opacity: 0.35; }
            55% { opacity: 0.60; }
            100% { opacity: 0.35; }
          }
          .xpot-aura-breath { animation: xpotAuraBreath 3.6s ease-in-out infinite; }

          @keyframes xpotNewSweep {
            0% { transform: translateX(-70%) skewX(-18deg); opacity: 0; }
            22% { opacity: 0.20; }
            65% { opacity: 0.10; }
            100% { transform: translateX(70%) skewX(-18deg); opacity: 0; }
          }
          .xpot-new-sweep {
            position: absolute;
            inset: -70px;
            pointer-events: none;
            background: linear-gradient(
              100deg,
              transparent 0%,
              rgba(255,255,255,0.05) 30%,
              rgba(var(--xpot-gold),0.16) 50%,
              rgba(56,189,248,0.10) 70%,
              transparent 100%
            );
            mix-blend-mode: screen;
            opacity: 0;
          }
          .xpot-new-sweep.on { animation: xpotNewSweep 1.35s ease-in-out 1; }

          @keyframes xpotVerifiedSheen {
            0% { transform: translateX(-120%) skewX(-16deg); opacity: 0; }
            20% { opacity: 0.22; }
            55% { opacity: 0.14; }
            100% { transform: translateX(120%) skewX(-16deg); opacity: 0; }
          }
          .xpot-verified-sheen {
            position: absolute;
            inset: -18px;
            background: linear-gradient(
              100deg,
              transparent 0%,
              rgba(var(--xpot-gold),0.10) 40%,
              rgba(255,255,255,0.10) 50%,
              rgba(var(--xpot-gold),0.10) 60%,
              transparent 100%
            );
            mix-blend-mode: screen;
            animation: xpotVerifiedSheen 6.5s ease-in-out infinite;
            opacity: 0;
          }
          .xpot-verified-shimmer:hover .xpot-verified-sheen { animation-duration: 4.2s; }

          @media (prefers-reduced-motion: reduce) {
            .xpot-live-dot { animation: none; }
            .xpot-aura-breath { animation: none; opacity: 0.45; }
            .xpot-new-sweep.on { animation: none; opacity: 0; }
            .xpot-verified-sheen { animation: none; opacity: 0; }
          }
        `}</style>

        <div className="pointer-events-none absolute -inset-[2px] rounded-[22px] opacity-60 blur-xl xpot-aura-breath bg-[radial-gradient(circle_at_18%_45%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_82%_50%,rgba(16,185,129,0.14),transparent_58%),radial-gradient(circle_at_50%_120%,rgba(var(--xpot-gold),0.12),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-white/[0.08]" />
        <div className="pointer-events-none absolute inset-0 rounded-[22px] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_50px_rgba(56,189,248,0.08),0_0_45px_rgba(16,185,129,0.06)]" />

        <div className={['xpot-new-sweep', newPulse && !reduceMotion ? 'on' : ''].join(' ')} />

        <div className="relative flex items-center gap-3 px-4 py-3 sm:px-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Users className="h-4 w-4 text-sky-200" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
              {label}
            </span>
          </div>

          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.92),transparent)]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-[linear-gradient(270deg,rgba(2,6,23,0.92),transparent)]" />

            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="relative flex items-center gap-2 pr-6">
                <div className={['xpot-new-sweep', newPulse && !reduceMotion ? 'on' : ''].join(' ')} />

                {has ? (
                  <>
                    {variant === 'ultra' ? (
                      <AnimatePresence initial={false}>
                        {row.map((e, idx) => {
                          const key = makeKey(e, idx);
                          const handle = normalizeHandle(e.handle);
                          const name = e.name ? String(e.name).trim() : '';
                          const isMe = Boolean(localHandle && normalizeHandle(localHandle) === handle);

                          return (
                            <motion.a
                              key={key}
                              href={isTouch ? undefined : toXProfileUrl(handle)}
                              onClick={ev => {
                                if (!isTouch) return;
                                ev.preventDefault();
                                setSheetEntry(e);
                              }}
                              target={isTouch ? undefined : '_blank'}
                              rel={isTouch ? undefined : 'nofollow noopener noreferrer'}
                              className={[
                                'group relative inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5',
                                'border-white/10 bg-white/[0.02] hover:bg-white/[0.045] transition',
                                isMe ? 'border-emerald-300/20 bg-emerald-500/10' : '',
                              ].join(' ')}
                              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, filter: 'blur(8px)' }}
                              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(8px)' }}
                              transition={reduceMotion ? undefined : { duration: 0.22, ease: 'easeOut' }}
                              aria-label={isTouch ? `Open ${handle}` : `Open ${handle} on X`}
                              title={handle}
                            >
                              <Avatar
                                src={e.avatarUrl}
                                label={handle}
                                verified={e.verified}
                                size={Math.max(30, avatarSize)}
                              />

                              {/* handle + name */}
                              <div className="min-w-0 leading-tight pr-1">
                                <div className="max-w-[150px] truncate text-[12px] font-semibold text-slate-200">
                                  {handle}
                                </div>
                                {name ? (
                                  <div className="max-w-[160px] truncate text-[11px] text-slate-500">
                                    {name}
                                  </div>
                                ) : null}
                              </div>

                              {/* desktop hover card */}
                              {!isTouch ? (
                                <div className="absolute left-1/2 top-full -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                  <ProfileHoverCard e={e} isMe={isMe} />
                                </div>
                              ) : null}
                            </motion.a>
                          );
                        })}
                      </AnimatePresence>
                    ) : null}

                    {variant === 'ticker' ? (
                      <AnimatePresence initial={false}>
                        {row.map((e, idx) => {
                          const key = makeKey(e, idx);
                          const handle = normalizeHandle(e.handle);
                          const isMe = Boolean(localHandle && normalizeHandle(localHandle) === handle);
                          return (
                            <motion.a
                              key={key}
                              href={toXProfileUrl(handle)}
                              target="_blank"
                              rel="nofollow noopener noreferrer"
                              className={[
                                'group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition',
                                'border-white/10 bg-white/[0.02] hover:bg-white/[0.045]',
                                isMe ? 'border-emerald-300/20 bg-emerald-500/10' : '',
                              ].join(' ')}
                              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, filter: 'blur(8px)' }}
                              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(8px)' }}
                              transition={reduceMotion ? undefined : { duration: 0.22, ease: 'easeOut' }}
                              aria-label={`Open ${handle} on X`}
                              title={handle}
                            >
                              <MiniDot src={e.avatarUrl} label={handle} verified={e.verified} />
                              <span className="max-w-[170px] truncate text-[12px] font-semibold text-slate-200">
                                {handle}
                              </span>
                              {e.name ? (
                                <span className="max-w-[220px] truncate text-[12px] text-slate-500">
                                  {e.name}
                                </span>
                              ) : null}
                            </motion.a>
                          );
                        })}
                      </AnimatePresence>
                    ) : null}

                    {variant === 'vip' ? (
                      <AnimatePresence initial={false}>
                        {row.map((e, idx) => {
                          const key = makeKey(e, idx);
                          const handle = normalizeHandle(e.handle);
                          const isMe = Boolean(localHandle && normalizeHandle(localHandle) === handle);

                          const border = e.verified
                            ? 'border-[rgba(var(--xpot-gold),0.30)] bg-[rgba(var(--xpot-gold),0.06)]'
                            : 'border-white/10 bg-white/[0.02]';

                          return (
                            <motion.a
                              key={key}
                              href={toXProfileUrl(handle)}
                              target="_blank"
                              rel="nofollow noopener noreferrer"
                              className={[
                                'group inline-flex items-center gap-3 rounded-full border px-3 py-2 transition',
                                border,
                                'hover:bg-white/[0.045]',
                                isMe ? 'ring-1 ring-emerald-300/20' : 'ring-1 ring-white/[0.04]',
                              ].join(' ')}
                              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, filter: 'blur(8px)' }}
                              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(8px)' }}
                              transition={reduceMotion ? undefined : { duration: 0.22, ease: 'easeOut' }}
                              aria-label={`Open ${handle} on X`}
                              title={handle}
                            >
                              <Avatar src={e.avatarUrl} label={handle} verified={e.verified} size={Math.max(26, avatarSize)} />
                              <div className="min-w-0 leading-tight">
                                <div className="flex items-center gap-2">
                                  <span className="max-w-[170px] truncate text-[12.5px] font-semibold text-slate-200">
                                    {handle}
                                  </span>
                                  {isMe ? (
                                    <span className="rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                                      You
                                    </span>
                                  ) : null}
                                </div>
                                {e.name ? (
                                  <div className="max-w-[240px] truncate text-[11.5px] text-slate-500">
                                    {e.name}
                                  </div>
                                ) : null}
                              </div>
                            </motion.a>
                          );
                        })}
                      </AnimatePresence>
                    ) : null}
                  </>
                ) : (
                  <div className="text-[12px] text-slate-400">No entries yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <span className="xpot-live-dot h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Live</span>
            <span className="font-mono text-[11px] text-slate-200">{list.length}</span>
          </div>
        </div>
      </Outer>

      <TapSheet open={Boolean(sheetEntry)} onClose={() => setSheetEntry(null)} entry={sheetEntry} isMe={sheetIsMe} />
    </>
  );
}
