// components/EnteringStageLive.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, ShieldCheck, Sparkles, Users } from 'lucide-react';

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
  size = 34,
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
      className="relative shrink-0 overflow-hidden rounded-full border border-white/12 bg-white/[0.04]"
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
        <div className="flex h-full w-full items-center justify-center font-mono text-[12px] text-slate-200">
          {initials}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.08]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.10),transparent_55%)]" />
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

  const top = list[0] ?? null;
  const rest = list.slice(1, 9);

  // Detect "newest" change to drive a premium reveal animation.
  const newestKey = useMemo(() => (top ? makeKey(top, 0) : null), [top]);
  const prevNewestKey = useRef<string | null>(null);
  const [justArrived, setJustArrived] = useState(false);

  useEffect(() => {
    if (!newestKey) return;
    if (prevNewestKey.current && prevNewestKey.current !== newestKey) {
      setJustArrived(true);
      const t = window.setTimeout(() => setJustArrived(false), 1400);
      return () => window.clearTimeout(t);
    }
    prevNewestKey.current = newestKey;
  }, [newestKey]);

  const Outer = embedded ? 'div' : 'section';
  const outerClass = embedded
    ? ['relative', className].join(' ')
    : [
        'relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.06]',
        'shadow-[0_38px_140px_rgba(0,0,0,0.60)]',
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
          <div className="pointer-events-none absolute -inset-28 opacity-70 blur-3xl bg-[radial-gradient(circle_at_18%_28%,rgba(56,189,248,0.10),transparent_62%),radial-gradient(circle_at_82%_26%,rgba(16,185,129,0.09),transparent_64%),radial-gradient(circle_at_50%_92%,rgba(var(--xpot-gold),0.08),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.25)_1px,transparent_0)] [background-size:18px_18px]" />
        </>
      ) : null}

      <div className="relative p-5 sm:p-6">
        {/* header */}
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

        {/* body */}
        <div className="mt-4">
          {has ? (
            <div className="grid gap-3">
              {/* Premium reveal row (no scrolling, no cheap marquee) */}
              <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] ring-1 ring-white/[0.05]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.55),rgba(16,185,129,0.45),transparent)] opacity-60" />
                <div className="pointer-events-none absolute -inset-24 opacity-80 blur-3xl bg-[radial-gradient(circle_at_25%_25%,rgba(56,189,248,0.10),transparent_60%),radial-gradient(circle_at_75%_25%,rgba(16,185,129,0.10),transparent_62%)]" />

                <div className="flex items-center justify-between px-5 py-3">
                  <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <Sparkles className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                    Fresh entry
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                    Updates automatically
                  </div>
                </div>

                <div className="px-3 pb-3">
                  <AnimatePresence initial={false}>
                    <motion.a
                      key={newestKey ?? 'none'}
                      href={toXProfileUrl(top!.handle)}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="group relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.04]"
                      initial={
                        reduceMotion
                          ? { opacity: 1 }
                          : { opacity: 0, y: 10, filter: 'blur(10px)' }
                      }
                      animate={
                        reduceMotion
                          ? { opacity: 1 }
                          : { opacity: 1, y: 0, filter: 'blur(0px)' }
                      }
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(10px)' }}
                      transition={reduceMotion ? undefined : { duration: 0.32, ease: 'easeOut' }}
                      aria-label={`Open ${top!.handle} on X`}
                      title={`Open ${top!.handle} on X`}
                    >
                      {/* subtle premium pulse */}
                      {!reduceMotion && justArrived ? (
                        <motion.div
                          className="pointer-events-none absolute inset-0 rounded-2xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.1, ease: 'easeInOut' }}
                          style={{
                            boxShadow:
                              '0 0 0 1px rgba(16,185,129,0.18), 0 0 32px rgba(16,185,129,0.14)',
                          }}
                        />
                      ) : null}

                      <Avatar src={top!.avatarUrl} label={top!.handle} size={40} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-semibold text-slate-100">
                            {normalizeHandle(top!.handle)}
                          </span>

                          {top!.verified ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-200/90">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          ) : null}

                          {localHandle && normalizeHandle(localHandle) === normalizeHandle(top!.handle) ? (
                            <span className="rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                              You
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-0.5 truncate text-[12px] text-slate-400">
                          {top!.name ? String(top!.name).trim() : 'Handle-first identity'}
                        </div>
                      </div>

                      <ExternalLink className="h-4 w-4 text-slate-600 transition group-hover:text-slate-300" />
                    </motion.a>
                  </AnimatePresence>
                </div>
              </div>

              {/* Premium list - stacked, calm, not "cheap scrolling" */}
              <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.02] ring-1 ring-white/[0.05]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)] opacity-70" />

                <div className="flex items-center justify-between px-5 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Recent entrants
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                    Live
                  </div>
                </div>

                <div className="px-3 pb-3">
                  <AnimatePresence initial={false}>
                    <motion.ul
                      layout
                      className="grid gap-2"
                      transition={reduceMotion ? undefined : { duration: 0.22, ease: 'easeOut' }}
                    >
                      {rest.length ? (
                        rest.map((e, idx) => {
                          const handle = normalizeHandle(e.handle);
                          const name = e.name ? String(e.name).trim() : '';
                          const key = makeKey(e, idx);
                          const isMe = Boolean(localHandle && normalizeHandle(localHandle) === handle);

                          return (
                            <motion.li
                              layout
                              key={key}
                              initial={
                                reduceMotion
                                  ? { opacity: 1 }
                                  : { opacity: 0, y: 10, filter: 'blur(8px)' }
                              }
                              animate={
                                reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }
                              }
                              exit={
                                reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(8px)' }
                              }
                              transition={reduceMotion ? undefined : { duration: 0.26, ease: 'easeOut' }}
                            >
                              <a
                                href={toXProfileUrl(handle)}
                                target="_blank"
                                rel="nofollow noopener noreferrer"
                                className={[
                                  'group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition',
                                  'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]',
                                  isMe
                                    ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_28px_rgba(16,185,129,0.10)]'
                                    : '',
                                ].join(' ')}
                                aria-label={`Open ${handle} on X`}
                                title={`Open ${handle} on X`}
                              >
                                <Avatar src={e.avatarUrl} label={handle} size={30} />

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate text-[13px] font-medium text-slate-200">
                                      {handle}
                                    </span>
                                    {e.verified ? (
                                      <ShieldCheck className="h-4 w-4 text-sky-200/90" />
                                    ) : null}
                                    {isMe ? (
                                      <span className="rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                                        You
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="truncate text-[11px] text-slate-500">
                                    {name ? name : 'x.com profile'}
                                  </div>
                                </div>

                                <ExternalLink className="h-4 w-4 text-slate-600 transition group-hover:text-slate-300" />
                              </a>
                            </motion.li>
                          );
                        })
                      ) : (
                        <motion.li
                          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400"
                        >
                          No additional entries yet.
                        </motion.li>
                      )}
                    </motion.ul>
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-1 text-[11px] text-slate-500">
                <span className="opacity-85">Handle-first identity</span>
                <span className="opacity-70">Curated feed, no marquee</span>
              </div>
            </div>
          ) : (
            <div className="rounded-[26px] border border-white/10 bg-white/[0.02] p-5 text-[13px] text-slate-400">
              No entries yet.
            </div>
          )}
        </div>
      </div>
    </Outer>
  );
}
