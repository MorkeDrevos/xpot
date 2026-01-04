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

  // VIP tags: verified gets gold outline, others neutral
  const frame = verified
    ? 'border-[rgba(var(--xpot-gold),0.35)] ring-2 ring-[rgba(var(--xpot-gold),0.28)] shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.16),0_0_26px_rgba(245,158,11,0.12)]'
    : 'border-white/12 ring-1 ring-white/[0.08]';

  return (
    <div
      className={[
        'relative shrink-0 overflow-hidden rounded-full border bg-white/[0.035]',
        frame,
      ].join(' ')}
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
    <span className={['relative inline-flex h-3.5 w-3.5 overflow-hidden rounded-full border bg-white/[0.04]', cls].join(' ')}>
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

function TooltipCard({
  e,
  isMe,
}: {
  e: EntryRow;
  isMe: boolean;
}) {
  const handle = normalizeHandle(e.handle);
  const name = e.name ? String(e.name).trim() : '';
  return (
    <div
      className={[
        'pointer-events-none absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2',
        'w-[240px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80',
        'ring-1 ring-white/[0.06] shadow-[0_30px_120px_rgba(0,0,0,0.70)]',
        'backdrop-blur-xl',
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.65),rgba(56,189,248,0.35),transparent)] opacity-70" />
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-slate-100">{handle}</div>
            {name ? (
              <div className="truncate text-[12px] text-slate-400">{name}</div>
            ) : (
              <div className="text-[12px] text-slate-600">x.com profile</div>
            )}
          </div>
          {isMe ? (
            <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
              You
            </span>
          ) : null}
        </div>

        <div className="mt-2 text-[11px] text-slate-500">Tap to open on X</div>
      </div>
    </div>
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
  avatarSize?: number; // used by vip + ultra
  max?: number;
}) {
  const reduceMotion = useReducedMotion();
  const localHandle = useLocalHandle();

  const list = useMemo(() => sanitize(entries), [entries]);
  const has = list.length > 0;

  const row = list.slice(0, max);
  const newest = row[0] ?? null;

  // premium “new entrant” calm sweep (not neon flash)
  const newestKey = useMemo(() => (newest ? makeKey(newest, 0) : null), [newest]);
  const prevNewestKey = useRef<string | null>(null);
  const [newPulse, setNewPulse] = useState(false);

  useEffect(() => {
    if (!newestKey) return;
    if (prevNewestKey.current && prevNewestKey.current !== newestKey) {
      setNewPulse(true);
      const t = window.setTimeout(() => setNewPulse(false), reduceMotion ? 300 : 1200);
      return () => window.clearTimeout(t);
    }
    prevNewestKey.current = newestKey;
  }, [newestKey, reduceMotion]);

  const Outer = embedded ? 'div' : 'section';
  const outerClass = embedded
    ? ['relative', className].join(' ')
    : [
        'relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/18 ring-1 ring-white/[0.05]',
        'shadow-[0_30px_140px_rgba(0,0,0,0.60)]',
        className,
      ].join(' ');

  return (
    <Outer className={outerClass}>
      <style jsx global>{`
        @keyframes xpotLiveDot {
          0% { opacity: 0.55; transform: scale(0.95); }
          55% { opacity: 1; transform: scale(1.06); }
          100% { opacity: 0.55; transform: scale(0.95); }
        }
        .xpot-live-dot { animation: xpotLiveDot 1.35s ease-in-out infinite; }

        @keyframes xpotNewSweep {
          0% { transform: translateX(-65%) skewX(-18deg); opacity: 0; }
          22% { opacity: 0.18; }
          65% { opacity: 0.08; }
          100% { transform: translateX(65%) skewX(-18deg); opacity: 0; }
        }
        .xpot-new-sweep {
          position: absolute;
          inset: -60px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255,255,255,0.05) 30%,
            rgba(var(--xpot-gold),0.16) 50%,
            rgba(56,189,248,0.09) 70%,
            transparent 100%
          );
          mix-blend-mode: screen;
          opacity: 0;
        }
        .xpot-new-sweep.on {
          animation: xpotNewSweep 1.25s ease-in-out 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .xpot-live-dot { animation: none; }
          .xpot-new-sweep.on { animation: none; opacity: 0; }
        }
      `}</style>

      {!embedded ? (
        <>
          <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_16%_40%,rgba(56,189,248,0.08),transparent_62%),radial-gradient(circle_at_84%_42%,rgba(16,185,129,0.07),transparent_64%),radial-gradient(circle_at_50%_120%,rgba(var(--xpot-gold),0.06),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.22)_1px,transparent_0)] [background-size:18px_18px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.55),rgba(56,189,248,0.30),transparent)] opacity-70" />
        </>
      ) : null}

      <div className="relative flex items-center gap-3 px-4 py-3 sm:px-5">
        {/* label */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <Users className="h-4 w-4 text-sky-200" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
            {label}
          </span>
        </div>

        {/* runway */}
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.92),transparent)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-[linear-gradient(270deg,rgba(2,6,23,0.92),transparent)]" />

          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="relative flex items-center gap-2 pr-6">
              <div className={['xpot-new-sweep', newPulse && !reduceMotion ? 'on' : ''].join(' ')} />

              {has ? (
                <>
                  {/* ULTRA: avatars only, hover reveals */}
                  {variant === 'ultra' ? (
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
                            className="group relative inline-flex items-center"
                            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, filter: 'blur(8px)' }}
                            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(8px)' }}
                            transition={reduceMotion ? undefined : { duration: 0.22, ease: 'easeOut' }}
                            aria-label={`Open ${handle} on X`}
                            title={handle}
                          >
                            <Avatar
                              src={e.avatarUrl}
                              label={handle}
                              verified={e.verified}
                              size={Math.max(28, avatarSize)}
                            />

                            {/* hover reveal */}
                            <div className="hidden group-hover:block">
                              <TooltipCard e={e} isMe={isMe} />
                            </div>
                          </motion.a>
                        );
                      })}
                    </AnimatePresence>
                  ) : null}

                  {/* TICKER: handle text only with tiny dot avatar */}
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

                  {/* VIP: verified gold outline, others neutral, zero icons */}
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
                            <Avatar
                              src={e.avatarUrl}
                              label={handle}
                              verified={e.verified}
                              size={Math.max(26, avatarSize)}
                            />

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

        {/* live count (clean, small) */}
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
