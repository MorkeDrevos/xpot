// components/EnteringStageLive.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, ShieldCheck, Users } from 'lucide-react';

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

function Avatar({
  src,
  label,
  size = 18,
}: {
  src?: string | null;
  label: string;
  size?: number;
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

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]"
      style={{ width: size, height: size }}
      title={normalizeHandle(label)}
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
        <div className="flex h-full w-full items-center justify-center font-mono text-[9px] text-slate-200">
          {initials}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.06]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.10),transparent_60%)]" />
    </div>
  );
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

export default function EnteringStageLive({
  entries,
  className = '',
  label = 'Entering the stage',
  embedded = false,
}: {
  entries: EntryRow[];
  className?: string;
  label?: string;
  embedded?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const localHandle = useLocalHandle();

  const list = useMemo(() => sanitize(entries), [entries]);
  const has = list.length > 0;

  // newest first, keep it compact
  const row = list.slice(0, 14);
  const newest = row[0] ?? null;

  // subtle “new entrant” glow when newest changes
  const newestKey = useMemo(() => (newest ? makeKey(newest, 0) : null), [newest]);
  const prevNewestKey = useRef<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!newestKey) return;
    if (prevNewestKey.current && prevNewestKey.current !== newestKey) {
      setFlash(true);
      const t = window.setTimeout(() => setFlash(false), reduceMotion ? 450 : 1200);
      return () => window.clearTimeout(t);
    }
    prevNewestKey.current = newestKey;
  }, [newestKey, reduceMotion]);

  const Outer = embedded ? 'div' : 'section';
  const outerClass = embedded
    ? ['relative', className].join(' ')
    : [
        'relative overflow-hidden rounded-[999px] border border-white/10 bg-slate-950/18 ring-1 ring-white/[0.05]',
        'shadow-[0_26px_110px_rgba(0,0,0,0.55)]',
        className,
      ].join(' ');

  return (
    <Outer className={outerClass}>
      <style jsx global>{`
        @keyframes xpotLiveDot {
          0% {
            opacity: 0.55;
            transform: scale(0.95);
          }
          55% {
            opacity: 1;
            transform: scale(1.06);
          }
          100% {
            opacity: 0.55;
            transform: scale(0.95);
          }
        }
        .xpot-live-dot {
          animation: xpotLiveDot 1.35s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .xpot-live-dot {
            animation: none;
          }
        }
      `}</style>

      {!embedded ? (
        <>
          <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_18%_40%,rgba(56,189,248,0.08),transparent_62%),radial-gradient(circle_at_82%_40%,rgba(16,185,129,0.07),transparent_64%),radial-gradient(circle_at_50%_120%,rgba(var(--xpot-gold),0.06),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.22)_1px,transparent_0)] [background-size:18px_18px]" />
        </>
      ) : null}

      <div className="relative flex items-center gap-3 px-4 py-3 sm:px-5">
        {/* left label pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <Users className="h-4 w-4 text-sky-200" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
            {label}
          </span>
        </div>

        {/* center one-line chips */}
        <div className="relative min-w-0 flex-1">
          {/* edge fades (premium) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.92),transparent)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-[linear-gradient(270deg,rgba(2,6,23,0.92),transparent)]" />

          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2 pr-6">
              {has ? (
                <>
                  <AnimatePresence initial={false}>
                    {newest ? (
                      <motion.a
                        key={newestKey ?? 'newest'}
                        href={toXProfileUrl(newest.handle)}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className={[
                          'group relative inline-flex items-center gap-2 rounded-full border px-3 py-2 transition',
                          'border-white/12 bg-white/[0.04] hover:bg-white/[0.06]',
                        ].join(' ')}
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, filter: 'blur(8px)' }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(8px)' }}
                        transition={reduceMotion ? undefined : { duration: 0.24, ease: 'easeOut' }}
                        aria-label={`Open ${normalizeHandle(newest.handle)} on X`}
                        title={`Open ${normalizeHandle(newest.handle)} on X`}
                      >
                        {/* premium flash ring */}
                        {!reduceMotion && flash ? (
                          <motion.div
                            className="pointer-events-none absolute inset-0 rounded-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.0, ease: 'easeInOut' }}
                            style={{
                              boxShadow:
                                '0 0 0 1px rgba(16,185,129,0.18), 0 0 28px rgba(16,185,129,0.12)',
                            }}
                          />
                        ) : null}

                        <Avatar src={newest.avatarUrl} label={newest.handle} size={20} />
                        <span className="text-[12px] font-semibold text-slate-100">
                          {normalizeHandle(newest.handle)}
                        </span>

                        {newest.verified ? <ShieldCheck className="h-4 w-4 text-sky-200/90" /> : null}

                        {localHandle && normalizeHandle(localHandle) === normalizeHandle(newest.handle) ? (
                          <span className="ml-1 rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                            You
                          </span>
                        ) : null}

                        <ExternalLink className="ml-1 h-4 w-4 text-slate-600 transition group-hover:text-slate-300" />
                      </motion.a>
                    ) : null}
                  </AnimatePresence>

                  {/* remaining chips */}
                  {row.slice(1).map((e, idx) => {
                    const handle = normalizeHandle(e.handle);
                    const key = makeKey(e, idx + 1);
                    const isMe = Boolean(localHandle && normalizeHandle(localHandle) === handle);

                    return (
                      <a
                        key={key}
                        href={toXProfileUrl(handle)}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className={[
                          'group inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 transition',
                          'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]',
                          isMe ? 'border-emerald-300/20 bg-emerald-500/10' : '',
                        ].join(' ')}
                        aria-label={`Open ${handle} on X`}
                        title={`Open ${handle} on X`}
                      >
                        <Avatar src={e.avatarUrl} label={handle} size={18} />
                        <span className="max-w-[140px] truncate text-[11px] font-medium text-slate-200">
                          {handle}
                        </span>
                        {e.verified ? <ShieldCheck className="h-3.5 w-3.5 text-sky-200/80" /> : null}
                      </a>
                    );
                  })}
                </>
              ) : (
                <div className="text-[12px] text-slate-400">No entries yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* right live */}
        <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <span className="xpot-live-dot h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Live
          </span>
          <span className="font-mono text-[11px] text-slate-200">{list.length}</span>
        </div>
      </div>
    </Outer>
  );
}
