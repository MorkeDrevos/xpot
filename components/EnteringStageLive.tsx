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

function formatAgo(ms: number) {
  if (!ms) return '';
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 8) return 'just now';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

function Avatar({
  src,
  label,
  size = 28,
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
        <div className="flex h-full w-full items-center justify-center font-mono text-[11px] text-slate-200">
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

  // show a clean “console feed” (no tiles, no marquee)
  const rows = list.slice(0, 8);

  // highlight newest on change
  const newestKey = useMemo(() => (rows[0] ? makeKey(rows[0], 0) : null), [rows]);
  const prevNewestKey = useRef<string | null>(null);
  const [flashKey, setFlashKey] = useState<string | null>(null);

  useEffect(() => {
    if (!newestKey) return;
    if (prevNewestKey.current && prevNewestKey.current !== newestKey) {
      setFlashKey(newestKey);
      const t = window.setTimeout(() => setFlashKey(null), reduceMotion ? 500 : 1400);
      return () => window.clearTimeout(t);
    }
    prevNewestKey.current = newestKey;
  }, [newestKey, reduceMotion]);

  const Outer = embedded ? 'div' : 'section';
  const outerClass = embedded
    ? ['relative', className].join(' ')
    : [
        'relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/20 ring-1 ring-white/[0.05]',
        'shadow-[0_34px_140px_rgba(0,0,0,0.58)]',
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
        @keyframes xpotSweep {
          0% {
            transform: translateX(-65%) skewX(-14deg);
            opacity: 0;
          }
          12% {
            opacity: 0.18;
          }
          52% {
            opacity: 0.08;
          }
          100% {
            transform: translateX(65%) skewX(-14deg);
            opacity: 0;
          }
        }
        .xpot-live-dot {
          animation: xpotLiveDot 1.35s ease-in-out infinite;
        }
        .xpot-sweep {
          animation: xpotSweep 12.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .xpot-live-dot {
            animation: none;
          }
          .xpot-sweep {
            animation: none;
          }
        }
      `}</style>

      {!embedded ? (
        <>
          {/* subtle XPOT nebula + scan grid */}
          <div className="pointer-events-none absolute -inset-24 opacity-65 blur-3xl bg-[radial-gradient(circle_at_18%_22%,rgba(56,189,248,0.10),transparent_62%),radial-gradient(circle_at_82%_24%,rgba(16,185,129,0.08),transparent_64%),radial-gradient(circle_at_50%_95%,rgba(var(--xpot-gold),0.07),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.22)_1px,transparent_0)] [background-size:18px_18px]" />
        </>
      ) : null}

      <div className="relative p-5 sm:p-6">
        {/* header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Users className="h-4 w-4 text-sky-200" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
              {label}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span className="xpot-live-dot h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            Live feed
          </div>
        </div>

        {/* console */}
        <div className="mt-4 relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.02] ring-1 ring-white/[0.05]">
          {/* top “console rule” + sweep */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.55),rgba(16,185,129,0.45),rgba(var(--xpot-gold),0.25),transparent)] opacity-70" />
          <div className="xpot-sweep pointer-events-none absolute -inset-10 bg-[linear-gradient(100deg,transparent_0%,rgba(255,255,255,0.04)_32%,rgba(56,189,248,0.05)_50%,rgba(16,185,129,0.04)_68%,transparent_100%)] opacity-0" />

          {/* inner rails */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[84px] bg-[linear-gradient(90deg,rgba(2,6,23,0.70),transparent)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.06),transparent_55%)]" />

          {/* title strip */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="leading-tight">
              <div className="text-[12px] font-semibold text-slate-100">Stage feed</div>
              <div className="text-[11px] text-slate-500">New entrants reveal cleanly - no scrolling</div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="font-mono text-[11px] text-slate-200">{list.length}</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                total today
              </span>
            </div>
          </div>

          {/* list */}
          <div className="px-3 pb-3">
            {has ? (
              <AnimatePresence initial={false}>
                <motion.ul layout className="grid gap-2">
                  {rows.map((e, idx) => {
                    const handle = normalizeHandle(e.handle);
                    const name = e.name ? String(e.name).trim() : '';
                    const key = makeKey(e, idx);
                    const isMe = Boolean(localHandle && normalizeHandle(localHandle) === handle);

                    const ms = safeTimeMs(e.createdAt);
                    const ago = formatAgo(ms);

                    const isFlash = Boolean(flashKey && flashKey === key);

                    return (
                      <motion.li
                        key={key}
                        layout
                        initial={
                          reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, filter: 'blur(10px)' }
                        }
                        animate={
                          reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }
                        }
                        exit={
                          reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(10px)' }
                        }
                        transition={reduceMotion ? undefined : { duration: 0.26, ease: 'easeOut' }}
                      >
                        <a
                          href={toXProfileUrl(handle)}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className={[
                            'group relative flex items-center gap-3 rounded-[18px] border px-3 py-3 transition',
                            'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]',
                            isMe
                              ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_24px_rgba(16,185,129,0.10)]'
                              : '',
                          ].join(' ')}
                          aria-label={`Open ${handle} on X`}
                          title={`Open ${handle} on X`}
                        >
                          {/* premium “new entrant” halo - subtle, not loud */}
                          {isFlash && !reduceMotion ? (
                            <motion.div
                              className="pointer-events-none absolute inset-0 rounded-[18px]"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1.2, ease: 'easeInOut' }}
                              style={{
                                boxShadow:
                                  '0 0 0 1px rgba(56,189,248,0.16), 0 0 28px rgba(16,185,129,0.10)',
                              }}
                            />
                          ) : null}

                          {/* left rail indicator */}
                          <div className="relative flex items-center">
                            <Avatar src={e.avatarUrl} label={handle} size={28} />
                            <span className="pointer-events-none absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-white/10 bg-slate-950/60 ring-1 ring-white/[0.06]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[13px] font-semibold text-slate-100">
                                {handle}
                              </span>

                              {e.verified ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/15 bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-100/90">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  Verified
                                </span>
                              ) : null}

                              {isMe ? (
                                <span className="rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                                  You
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-0.5 truncate text-[11px] text-slate-500">
                              {name ? name : 'Entered the stage'}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {ago ? (
                              <span className="hidden sm:inline font-mono text-[11px] text-slate-500">
                                {ago}
                              </span>
                            ) : null}
                            <ExternalLink className="h-4 w-4 text-slate-600 transition group-hover:text-slate-300" />
                          </div>
                        </a>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </AnimatePresence>
            ) : (
              <div className="rounded-[18px] border border-white/10 bg-white/[0.02] px-4 py-4 text-[13px] text-slate-400">
                No entries yet.
              </div>
            )}

            {/* bottom meta */}
            <div className="mt-3 flex items-center justify-between px-2 text-[11px] text-slate-500">
              <span className="opacity-85">Handle-first identity</span>
              <span className="opacity-70">Live updates</span>
            </div>
          </div>
        </div>
      </div>
    </Outer>
  );
}
