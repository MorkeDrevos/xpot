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

  // Deduplicate by id if present, otherwise by handle+createdAt
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
  const top = list[0] ?? null;

  // "New entrant" highlight pulse: detect changes of the newest key
  const newestKey = useMemo(() => (top ? makeKey(top, 0) : null), [top]);
  const prevNewestKey = useRef<string | null>(null);
  const [flashKey, setFlashKey] = useState<string | null>(null);

  useEffect(() => {
    if (!newestKey) return;
    if (prevNewestKey.current && prevNewestKey.current !== newestKey) {
      setFlashKey(newestKey);
      const t = window.setTimeout(() => setFlashKey(null), 1400);
      return () => window.clearTimeout(t);
    }
    prevNewestKey.current = newestKey;
  }, [newestKey]);

  const has = list.length > 0;

  const Outer = embedded ? 'div' : 'section';
  const outerClass = embedded
    ? ['relative', className].join(' ')
    : [
        'relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.06]',
        'shadow-[0_38px_140px_rgba(0,0,0,0.60)]',
        className,
      ].join(' ');

  const recent = list.slice(0, 8);

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
          <div className="pointer-events-none absolute -inset-28 opacity-70 blur-3xl bg-[radial-gradient(circle_at_18%_35%,rgba(56,189,248,0.10),transparent_62%),radial-gradient(circle_at_82%_30%,rgba(16,185,129,0.09),transparent_64%),radial-gradient(circle_at_50%_85%,rgba(245,158,11,0.06),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.25)_1px,transparent_0)] [background-size:18px_18px]" />
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
        <div className="mt-4 grid gap-4">
          {/* Spotlight (newest) */}
          {has ? (
            <a
              href={toXProfileUrl(top!.handle)}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className={[
                'group relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03]',
                'ring-1 ring-white/[0.06] transition',
                'hover:bg-white/[0.045]',
              ].join(' ')}
              aria-label={`Open ${top!.handle} on X`}
              title={`Open ${top!.handle} on X`}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(56,189,248,0.10),transparent_35%,rgba(16,185,129,0.10))] opacity-70" />
              <div className="pointer-events-none absolute -inset-20 opacity-80 blur-3xl bg-[radial-gradient(circle_at_25%_25%,rgba(245,158,11,0.08),transparent_60%),radial-gradient(circle_at_75%_30%,rgba(56,189,248,0.10),transparent_62%)]" />

              {/* Premium "new entrant" pulse */}
              <AnimatePresence>
                {flashKey && newestKey && flashKey === newestKey && !reduceMotion ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0"
                  >
                    <div className="absolute inset-0 rounded-[26px] ring-2 ring-emerald-300/20 shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_0_34px_rgba(16,185,129,0.18)]" />
                    <motion.div
                      initial={{ opacity: 0.0 }}
                      animate={{ opacity: [0.0, 0.35, 0.0] }}
                      transition={{ duration: 1.2, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-[26px] bg-[radial-gradient(circle_at_35%_30%,rgba(16,185,129,0.18),transparent_55%)]"
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="relative flex items-center gap-4 p-4 sm:p-5">
                <div className="relative">
                  <Avatar src={top!.avatarUrl} label={top!.handle} size={44} />
                  {top!.verified ? (
                    <div className="absolute -bottom-1 -right-1 rounded-full border border-white/10 bg-slate-950/70 p-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-sky-200" />
                    </div>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold text-slate-100">
                          {top!.handle}
                        </span>
                        {localHandle && normalizeHandle(localHandle) === top!.handle ? (
                          <span className="rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                            You
                          </span>
                        ) : (
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300/90">
                            New entrant
                          </span>
                        )}
                      </div>

                      {top!.name ? (
                        <div className="mt-0.5 truncate text-[12px] text-slate-400">{top!.name}</div>
                      ) : (
                        <div className="mt-0.5 text-[12px] text-slate-500">Handle-first identity</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                  <ExternalLink className="h-4 w-4 transition group-hover:text-slate-300" />
                </div>
              </div>
            </a>
          ) : (
            <div className="rounded-[26px] border border-white/10 bg-white/[0.02] p-5 text-[13px] text-slate-400">
              Waiting for the first entries to appear in the feed.
            </div>
          )}

          {/* Recent list (no scrolling marquee) */}
          <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.02] ring-1 ring-white/[0.05]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.55),rgba(16,185,129,0.45),transparent)] opacity-60" />

            <div className="flex items-center justify-between px-5 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Recent entrants
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                Updates automatically
              </div>
            </div>

            <div className="px-3 pb-3">
              <AnimatePresence initial={false}>
                <motion.ul
                  layout
                  className="grid gap-2"
                  transition={reduceMotion ? undefined : { duration: 0.22, ease: 'easeOut' }}
                >
                  {recent.map((e, idx) => {
                    const handle = normalizeHandle(e.handle);
                    const name = e.name ? String(e.name).trim() : '';
                    const key = makeKey(e, idx);
                    const isMe = Boolean(localHandle && normalizeHandle(localHandle) === handle);
                    const isTop = idx === 0;

                    return (
                      <motion.li
                        layout
                        key={key}
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, filter: 'blur(6px)' }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(6px)' }}
                        transition={reduceMotion ? undefined : { duration: 0.28, ease: 'easeOut' }}
                      >
                        <a
                          href={toXProfileUrl(handle)}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className={[
                            'group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition',
                            isTop
                              ? 'border-white/12 bg-white/[0.035]'
                              : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.04]',
                            isMe
                              ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.20),0_0_28px_rgba(16,185,129,0.12)]'
                              : '',
                          ].join(' ')}
                          aria-label={`Open ${handle} on X`}
                          title={`Open ${handle} on X`}
                        >
                          <Avatar src={e.avatarUrl} label={handle} size={32} />

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
                            {name ? (
                              <div className="truncate text-[11px] text-slate-400">{name}</div>
                            ) : (
                              <div className="truncate text-[11px] text-slate-600">x.com profile</div>
                            )}
                          </div>

                          <ExternalLink className="h-4 w-4 text-slate-600 transition group-hover:text-slate-300" />
                        </a>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </AnimatePresence>

              {!has ? (
                <div className="px-2 pt-2 text-[12px] text-slate-500">No activity yet.</div>
              ) : null}
            </div>
          </div>

          {/* footer row */}
          <div className="flex items-center justify-between gap-3 px-1 text-[11px] text-slate-500">
            <span className="opacity-85">Handle-first identity</span>
            <span className="opacity-70">Premium reveal, no marquee</span>
          </div>
        </div>
      </div>
    </Outer>
  );
}
