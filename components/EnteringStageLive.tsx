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

      {/* glass + highlight */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.09]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.14),transparent_58%)]" />
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

  // dedupe: id first, else handle+createdAt
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

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'emerald' | 'sky' | 'gold';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100/90'
      : tone === 'sky'
      ? 'border-sky-300/20 bg-sky-500/10 text-sky-100/90'
      : tone === 'gold'
      ? 'border-[rgba(var(--xpot-gold),0.22)] bg-[rgba(var(--xpot-gold),0.10)] text-[rgb(var(--xpot-gold-2))]'
      : 'border-white/10 bg-white/[0.03] text-slate-200/90';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]',
        cls,
      ].join(' ')}
    >
      {children}
    </span>
  );
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

  const newest = list[0] ?? null;
  const grid = list.slice(1, 7); // 6 tiles

  // arrival overlay (premium, not “scrolling”)
  const newestKey = useMemo(() => (newest ? makeKey(newest, 0) : null), [newest]);
  const prevNewestKey = useRef<string | null>(null);
  const [arrival, setArrival] = useState<EntryRow | null>(null);

  useEffect(() => {
    if (!newestKey || !newest) return;

    if (prevNewestKey.current && prevNewestKey.current !== newestKey) {
      setArrival(newest);
      const t = window.setTimeout(() => setArrival(null), reduceMotion ? 650 : 1600);
      return () => window.clearTimeout(t);
    }

    prevNewestKey.current = newestKey;
  }, [newestKey, newest, reduceMotion]);

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
          <div className="pointer-events-none absolute -inset-28 opacity-70 blur-3xl bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.10),transparent_60%),radial-gradient(circle_at_85%_25%,rgba(16,185,129,0.09),transparent_64%),radial-gradient(circle_at_50%_95%,rgba(var(--xpot-gold),0.08),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.22)_1px,transparent_0)] [background-size:18px_18px]" />
        </>
      ) : null}

      <div className="relative p-5 sm:p-6">
        {/* header */}
        <div className="flex items-center justify-between gap-3">
          <Pill>
            <Users className="h-4 w-4 text-sky-200" />
            {label}
          </Pill>

          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span className="xpot-live-dot h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            Live feed
          </div>
        </div>

        {/* content */}
        <div className="mt-4">
          {has ? (
            <div className="relative">
              {/* Arrival overlay */}
              <AnimatePresence>
                {arrival && !reduceMotion ? (
                  <motion.div
                    key={makeKey(arrival, 0)}
                    initial={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -6, scale: 0.99, filter: 'blur(10px)' }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-x-0 -top-2 z-20"
                  >
                    <div className="mx-auto w-full max-w-[520px]">
                      <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/70 p-3 ring-1 ring-white/[0.06] shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur">
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(56,189,248,0.10),transparent_35%,rgba(16,185,129,0.10))]" />
                        <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_20%_25%,rgba(56,189,248,0.16),transparent_60%),radial-gradient(circle_at_80%_25%,rgba(16,185,129,0.16),transparent_62%)]" />
                        <div className="relative flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={arrival.avatarUrl} label={arrival.handle} size={36} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-[13px] font-semibold text-slate-100">
                                  {normalizeHandle(arrival.handle)}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300/90">
                                  <Sparkles className="h-3.5 w-3.5 text-[rgb(var(--xpot-gold-2))]" />
                                  New entry
                                </span>
                              </div>
                              <div className="mt-0.5 truncate text-[11px] text-slate-400">
                                {arrival.name ? String(arrival.name).trim() : 'Entered the stage'}
                              </div>
                            </div>
                          </div>

                          <div className="hidden sm:flex items-center gap-2">
                            {arrival.verified ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-100/90">
                                <ShieldCheck className="h-4 w-4" />
                                Verified
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Main console */}
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.02] ring-1 ring-white/[0.05]">
                {/* top gradient rule */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.60),rgba(16,185,129,0.55),rgba(var(--xpot-gold),0.35),transparent)] opacity-70" />
                {/* inner sheen */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.06),transparent_55%)]" />

                {/* head row */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-2xl border border-white/10 bg-white/[0.03] ring-1 ring-white/[0.05] flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-[12px] font-semibold text-slate-100">Live entries</div>
                      <div className="text-[11px] text-slate-500">Curated reveal - no marquee</div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2">
                    <Pill tone="neutral">
                      <span className="text-slate-300/90">{list.length}</span>
                      total today
                    </Pill>
                  </div>
                </div>

                {/* newest spotlight */}
                <div className="px-4 pb-4">
                  <AnimatePresence initial={false}>
                    {newest ? (
                      <motion.a
                        key={newestKey ?? 'newest'}
                        href={toXProfileUrl(newest.handle)}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="group relative flex items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 ring-1 ring-white/[0.05] transition hover:bg-white/[0.05]"
                        initial={
                          reduceMotion
                            ? { opacity: 1 }
                            : { opacity: 0, y: 10, scale: 0.99, filter: 'blur(10px)' }
                        }
                        animate={
                          reduceMotion
                            ? { opacity: 1 }
                            : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
                        }
                        exit={
                          reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(10px)' }
                        }
                        transition={reduceMotion ? undefined : { duration: 0.32, ease: 'easeOut' }}
                        aria-label={`Open ${normalizeHandle(newest.handle)} on X`}
                        title={`Open ${normalizeHandle(newest.handle)} on X`}
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(110deg,rgba(56,189,248,0.10),transparent_40%,rgba(16,185,129,0.10))] opacity-70" />

                        <div className="relative">
                          <Avatar src={newest.avatarUrl} label={newest.handle} size={44} />
                          {newest.verified ? (
                            <div className="absolute -bottom-1 -right-1 rounded-full border border-white/10 bg-slate-950/70 p-1 ring-1 ring-white/[0.06]">
                              <ShieldCheck className="h-3.5 w-3.5 text-sky-200" />
                            </div>
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[15px] font-semibold text-slate-100">
                              {normalizeHandle(newest.handle)}
                            </span>

                            {localHandle && normalizeHandle(localHandle) === normalizeHandle(newest.handle) ? (
                              <span className="rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                                You
                              </span>
                            ) : null}

                            {newest.verified ? (
                              <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-100/90">
                                Verified
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1 truncate text-[12px] text-slate-400">
                            {newest.name ? String(newest.name).trim() : 'Entered the stage'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-500">
                          <ExternalLink className="h-4 w-4 transition group-hover:text-slate-300" />
                        </div>
                      </motion.a>
                    ) : null}
                  </AnimatePresence>

                  {/* premium tiles */}
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <AnimatePresence initial={false}>
                      {grid.length ? (
                        grid.map((e, idx) => {
                          const h = normalizeHandle(e.handle);
                          const name = e.name ? String(e.name).trim() : '';
                          const key = makeKey(e, idx);
                          const isMe = Boolean(localHandle && normalizeHandle(localHandle) === h);

                          return (
                            <motion.a
                              key={key}
                              href={toXProfileUrl(h)}
                              target="_blank"
                              rel="nofollow noopener noreferrer"
                              className={[
                                'group flex items-center gap-3 rounded-[18px] border px-3 py-3 transition',
                                'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]',
                                isMe
                                  ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_26px_rgba(16,185,129,0.10)]'
                                  : '',
                              ].join(' ')}
                              initial={
                                reduceMotion
                                  ? { opacity: 1 }
                                  : { opacity: 0, y: 10, filter: 'blur(8px)' }
                              }
                              animate={
                                reduceMotion
                                  ? { opacity: 1 }
                                  : { opacity: 1, y: 0, filter: 'blur(0px)' }
                              }
                              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(8px)' }}
                              transition={
                                reduceMotion
                                  ? undefined
                                  : { duration: 0.26, ease: 'easeOut', delay: Math.min(0.12, idx * 0.03) }
                              }
                              aria-label={`Open ${h} on X`}
                              title={`Open ${h} on X`}
                            >
                              <Avatar src={e.avatarUrl} label={h} size={32} />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-[13px] font-medium text-slate-200">{h}</span>
                                  {e.verified ? <ShieldCheck className="h-4 w-4 text-sky-200/90" /> : null}
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
                            </motion.a>
                          );
                        })
                      ) : (
                        <motion.div
                          key="no-grid"
                          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-[18px] border border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400 sm:col-span-2"
                        >
                          More entries will appear here.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 px-1 text-[11px] text-slate-500">
                    <span className="opacity-85">Handle-first identity</span>
                    <span className="opacity-70">Premium reveal</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.02] ring-1 ring-white/[0.05]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.55),rgba(16,185,129,0.45),transparent)] opacity-60" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <Pill>
                    <Users className="h-4 w-4 text-sky-200" />
                    Live entries
                  </Pill>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">Idle</div>
                </div>
                <div className="mt-4 text-[13px] text-slate-400">No entries yet.</div>
                <div className="mt-2 text-[11px] text-slate-500">The feed will light up as soon as the first entry lands.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Outer>
  );
}
