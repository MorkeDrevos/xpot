// components/LiveActivityModule.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, Users } from 'lucide-react';

export type EntryRow = {
  id?: string;
  createdAt?: string;
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  verified?: boolean;
};

type Variant = 'ultra' | 'ticker' | 'vip';

const MOBILE_MAX = 639;

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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= MOBILE_MAX);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return isMobile;
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

function VerifiedShimmer({ className = '' }: { className?: string }) {
  return (
    <span
      className={[
        'relative inline-flex h-4 items-center justify-center rounded-full px-2',
        'bg-[rgba(var(--xpot-gold),0.10)] text-[10px] font-semibold uppercase tracking-[0.18em]',
        'text-[rgba(var(--xpot-gold-2),0.95)]',
        className,
      ].join(' ')}
    >
      <span className="relative z-10">Verified</span>
      <span className="xpot-verified-shimmer pointer-events-none absolute inset-0 rounded-full opacity-70" />
    </span>
  );
}

function Avatar({
  src,
  handle,
  verified,
  size,
}: {
  src?: string | null;
  handle: string;
  verified?: boolean;
  size: number;
}) {
  const h = useMemo(() => normalizeHandle(handle).replace(/^@/, '').trim(), [handle]);

  const resolvedSrc = useMemo(() => {
    if (src) return src;
    if (!h) return null;
    const cacheKey = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    return `https://unavatar.io/twitter/${encodeURIComponent(h)}?cache=${cacheKey}`;
  }, [src, h]);

  const [failed, setFailed] = useState(false);

  const initials = useMemo(() => {
    const s = h || '';
    if (!s) return 'X';
    return s.slice(0, 2).toUpperCase();
  }, [h]);

  const frame = verified
    ? [
        'border-[rgba(var(--xpot-gold),0.35)] ring-2 ring-[rgba(var(--xpot-gold),0.22)]',
        'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.12),0_0_22px_rgba(245,158,11,0.10)]',
      ].join(' ')
    : 'border-white/12 ring-1 ring-white/[0.08]';

  return (
    <div
      className={['relative shrink-0 overflow-hidden rounded-full border bg-white/[0.035]', frame].join(' ')}
      style={{ width: size, height: size }}
      title={normalizeHandle(handle)}
    >
      {resolvedSrc && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt={normalizeHandle(handle)}
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

      {/* soft specular highlight */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.06]" />

      {/* verified micro shimmer (very subtle) */}
      {verified ? <div className="xpot-avatar-verified-sheen pointer-events-none absolute inset-0 opacity-60" /> : null}
    </div>
  );
}

function MiniDot({
  src,
  handle,
  verified,
}: {
  src?: string | null;
  handle: string;
  verified?: boolean;
}) {
  const h = useMemo(() => normalizeHandle(handle).replace(/^@/, '').trim(), [handle]);

  const resolvedSrc = useMemo(() => {
    if (src) return src;
    if (!h) return null;
    const cacheKey = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    return `https://unavatar.io/twitter/${encodeURIComponent(h)}?cache=${cacheKey}`;
  }, [src, h]);

  const [failed, setFailed] = useState(false);

  const cls = verified
    ? 'border-[rgba(var(--xpot-gold),0.38)] ring-1 ring-[rgba(var(--xpot-gold),0.20)]'
    : 'border-white/14 ring-1 ring-white/[0.06]';

  return (
    <span className={['relative inline-flex h-4 w-4 overflow-hidden rounded-full border bg-white/[0.04]', cls].join(' ')}>
      {resolvedSrc && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt={normalizeHandle(handle)}
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

type HoverCardPosition = { left: number; top: number };

function usePortalMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function HoverCard({
  e,
  anchorEl,
  open,
  onClose,
}: {
  e: EntryRow;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const mounted = usePortalMounted();

  const [pos, setPos] = useState<HoverCardPosition | null>(null);

  const handle = normalizeHandle(e.handle);
  const handleNoAt = handle.replace(/^@/, '');
  const name = (e.name ? String(e.name).trim() : '') || handle;
  const verified = Boolean(e.verified);

  useEffect(() => {
    if (!open) return;
    if (!anchorEl) return;

    const update = () => {
      const r = anchorEl.getBoundingClientRect();

      // ✅ LOWER + closer (under the avatar, not floating)
      const left = r.left + r.width / 2;
      const top = r.bottom + 10;

      setPos({ left, top });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    const t = window.setTimeout(update, 0);

    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      window.clearTimeout(t);
    };
  }, [open, anchorEl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mounted || !pos || typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed z-[9999] -translate-x-1/2"
        style={{ left: pos.left, top: pos.top }}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4, filter: 'blur(10px)' }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: 'blur(10px)' }}
        transition={reduceMotion ? undefined : { duration: 0.16, ease: 'easeOut' }}
      >
        {/* ✅ No border. Softer, X-like glass. */}
        <div
          className={[
            'relative w-[320px] overflow-hidden rounded-2xl',
            'bg-slate-950/82 backdrop-blur-xl',
            'shadow-[0_22px_70px_rgba(0,0,0,0.55)]',
          ].join(' ')}
          role="tooltip"
        >
          <div className="pointer-events-none absolute -inset-24 opacity-60 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.08),transparent_60%),radial-gradient(circle_at_60%_0%,rgba(var(--xpot-gold),0.10),transparent_62%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)]" />

          <div className="relative p-4">
            <div className="flex items-center gap-3">
              <Avatar src={e.avatarUrl} handle={handle} verified={verified} size={44} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-slate-50 leading-tight">
                      {name}
                    </div>
                    <div className="truncate text-[12px] text-slate-400 leading-tight">
                      @{handleNoAt}
                    </div>
                  </div>

                  {verified ? <VerifiedShimmer /> : null}
                </div>

                <a
                  href={toXProfileUrl(handle)}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition"
                >
                  Open on X
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          {/* tiny caret */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1">
            <div className="h-2 w-2 rotate-45 bg-slate-950/82 backdrop-blur-xl" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function MobileSheet({
  open,
  e,
  onClose,
}: {
  open: boolean;
  e: EntryRow | null;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const mounted = usePortalMounted();

  if (!open || !e || !mounted || typeof document === 'undefined' || !document.body) return null;

  const handle = normalizeHandle(e.handle);
  const handleNoAt = handle.replace(/^@/, '');
  const name = (e.name ? String(e.name).trim() : '') || handle;
  const verified = Boolean(e.verified);

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reduceMotion ? undefined : { duration: 0.14 }}
      >
        <div
          className="absolute inset-0 bg-black/55"
          onClick={onClose}
          aria-hidden
        />

        <motion.div
          className="absolute inset-x-0 bottom-0"
          initial={reduceMotion ? { y: 0 } : { y: 28, opacity: 0, filter: 'blur(10px)' }}
          animate={reduceMotion ? { y: 0 } : { y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={reduceMotion ? { y: 0 } : { y: 28, opacity: 0, filter: 'blur(10px)' }}
          transition={reduceMotion ? undefined : { duration: 0.18, ease: 'easeOut' }}
        >
          <div className="mx-auto w-full max-w-lg px-4 pb-5">
            <div className="relative overflow-hidden rounded-3xl bg-slate-950/92 backdrop-blur-xl shadow-[0_40px_140px_rgba(0,0,0,0.65)]">
              <div className="pointer-events-none absolute -inset-24 opacity-65 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.10),transparent_60%),radial-gradient(circle_at_60%_0%,rgba(var(--xpot-gold),0.12),transparent_62%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.35),rgba(56,189,248,0.18),transparent)] opacity-80" />

              <div className="relative p-5">
                <div className="flex items-center gap-4">
                  <Avatar src={e.avatarUrl} handle={handle} verified={verified} size={56} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[16px] font-semibold text-slate-50 leading-tight">
                          {name}
                        </div>
                        <div className="truncate text-[13px] text-slate-400 leading-tight">
                          @{handleNoAt}
                        </div>
                      </div>
                      {verified ? <VerifiedShimmer className="mt-0.5" /> : null}
                    </div>

                    <a
                      href={toXProfileUrl(handle)}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[13px] font-semibold text-slate-100 hover:bg-white/[0.08] transition"
                    >
                      Open profile on X
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </a>

                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-[12px] font-semibold text-slate-300 hover:bg-white/[0.05] transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)]" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

export default function EnteringStageLive({
  entries,
  className = '',
  label = 'Entering the stage',
  embedded = false,
  variant = 'ultra',
  avatarSize = 34,
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
  const localHandle = useLocalHandle();
  const isMobile = useIsMobile();

  const list = useMemo(() => sanitize(entries), [entries]);
  const has = list.length > 0;

  const row = list.slice(0, max);
  const newest = row[0] ?? null;

  const newestKey = useMemo(() => (newest ? makeKey(newest, 0) : null), [newest]);
  const prevNewestKey = useRef<string | null>(null);
  const [newPulse, setNewPulse] = useState(false);

  useEffect(() => {
    if (!newestKey) return;
    if (prevNewestKey.current && prevNewestKey.current !== newestKey) {
      setNewPulse(true);
      const t = window.setTimeout(() => setNewPulse(false), reduceMotion ? 240 : 900);
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

  // hover card state
  const [hovered, setHovered] = useState<EntryRow | null>(null);
  const [hoverAnchor, setHoverAnchor] = useState<HTMLElement | null>(null);
  const hoverCloseT = useRef<number | null>(null);

  // mobile sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetEntry, setSheetEntry] = useState<EntryRow | null>(null);

  const closeHover = () => {
    setHovered(null);
    setHoverAnchor(null);
  };

  const scheduleCloseHover = () => {
    if (hoverCloseT.current) window.clearTimeout(hoverCloseT.current);
    hoverCloseT.current = window.setTimeout(() => closeHover(), 90);
  };

  const cancelCloseHover = () => {
    if (hoverCloseT.current) window.clearTimeout(hoverCloseT.current);
    hoverCloseT.current = null;
  };

  useEffect(() => {
    return () => {
      if (hoverCloseT.current) window.clearTimeout(hoverCloseT.current);
    };
  }, []);

  return (
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
        .xpot-new-sweep.on { animation: xpotNewSweep 1.15s ease-in-out 1; }

        /* verified shimmer */
        @keyframes xpotVerifiedShimmer {
          0% { transform: translateX(-60%) skewX(-16deg); opacity: 0; }
          10% { opacity: 0.55; }
          45% { opacity: 0.28; }
          100% { transform: translateX(60%) skewX(-16deg); opacity: 0; }
        }
        .xpot-verified-shimmer {
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255,255,255,0.05) 30%,
            rgba(var(--xpot-gold),0.22) 50%,
            rgba(255,255,255,0.04) 70%,
            transparent 100%
          );
          mix-blend-mode: screen;
          animation: xpotVerifiedShimmer 2.9s ease-in-out infinite;
          filter: blur(0.2px);
        }

        @keyframes xpotAvatarSheen {
          0% { transform: translateX(-60%) skewX(-16deg); opacity: 0; }
          20% { opacity: 0.18; }
          55% { opacity: 0.08; }
          100% { transform: translateX(60%) skewX(-16deg); opacity: 0; }
        }
        .xpot-avatar-verified-sheen {
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255,255,255,0.05) 30%,
            rgba(var(--xpot-gold),0.14) 50%,
            rgba(255,255,255,0.04) 70%,
            transparent 100%
          );
          mix-blend-mode: screen;
          animation: xpotAvatarSheen 4.8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .xpot-live-dot { animation: none; }
          .xpot-aura-breath { animation: none; opacity: 0.45; }
          .xpot-new-sweep.on { animation: none; opacity: 0; }
          .xpot-verified-shimmer { animation: none; opacity: 0; }
          .xpot-avatar-verified-sheen { animation: none; opacity: 0; }
        }
      `}</style>

      {/* Premium ambient aura (alive) */}
      <div
        className="pointer-events-none absolute -inset-[2px] rounded-[22px] opacity-60 blur-xl xpot-aura-breath
        bg-[radial-gradient(circle_at_18%_45%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_82%_50%,rgba(16,185,129,0.14),transparent_58%),radial-gradient(circle_at_50%_120%,rgba(var(--xpot-gold),0.12),transparent_60%)]"
      />

      {/* Thin luminous rim */}
      <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-white/[0.08]" />
      <div
        className="pointer-events-none absolute inset-0 rounded-[22px]
        shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_50px_rgba(56,189,248,0.08),0_0_45px_rgba(16,185,129,0.06)]"
      />

      {!embedded ? (
        <>
          <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_16%_40%,rgba(56,189,248,0.08),transparent_62%),radial-gradient(circle_at_84%_42%,rgba(16,185,129,0.07),transparent_64%),radial-gradient(circle_at_50%_120%,rgba(var(--xpot-gold),0.06),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.22)_1px,transparent_0)] [background-size:18px_18px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.55),rgba(56,189,248,0.30),transparent)] opacity-70" />
        </>
      ) : null}

      {/* full container sweep */}
      <div className={['xpot-new-sweep', newPulse && !reduceMotion ? 'on' : ''].join(' ')} />

      <div className="relative flex items-center gap-3 px-4 py-3 sm:px-5">
        {/* label */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <Users className="h-4 w-4 text-sky-200" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">{label}</span>
        </div>

        {/* runway */}
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.92),transparent)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-[linear-gradient(270deg,rgba(2,6,23,0.92),transparent)]" />

          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="relative flex items-center gap-2 pr-6">
              {has ? (
                <>
                  {/* ULTRA */}
                  {variant === 'ultra' ? (
                    <AnimatePresence initial={false}>
                      {row.map((e, idx) => {
                        const key = makeKey(e, idx);
                        const handle = normalizeHandle(e.handle);
                        const isMe = Boolean(localHandle && normalizeHandle(localHandle) === handle);

                        const displayName = (e.name ? String(e.name).trim() : '') || handle;
                        const chipText = isMobile ? displayName : handle; // mobile looks nicer with name; desktop stays @handle

                        return (
                          <motion.div
                            key={key}
                            className="relative"
                            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, filter: 'blur(8px)' }}
                            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(8px)' }}
                            transition={reduceMotion ? undefined : { duration: 0.22, ease: 'easeOut' }}
                          >
                            <a
                              href={toXProfileUrl(handle)}
                              target="_blank"
                              rel="nofollow noopener noreferrer"
                              className={[
                                'group inline-flex items-center gap-2 rounded-full border px-3 py-2 transition',
                                'border-white/10 bg-white/[0.02] hover:bg-white/[0.045]',
                                isMe ? 'border-emerald-300/20 bg-emerald-500/10' : '',
                              ].join(' ')}
                              onMouseEnter={ev => {
                                if (isMobile) return;
                                cancelCloseHover();
                                setHovered(e);
                                setHoverAnchor(ev.currentTarget);
                              }}
                              onMouseLeave={() => {
                                if (isMobile) return;
                                scheduleCloseHover();
                              }}
                              onFocus={ev => {
                                if (isMobile) return;
                                cancelCloseHover();
                                setHovered(e);
                                setHoverAnchor(ev.currentTarget);
                              }}
                              onBlur={() => {
                                if (isMobile) return;
                                scheduleCloseHover();
                              }}
                              onClick={ev => {
                                if (!isMobile) return;
                                ev.preventDefault();
                                setSheetEntry(e);
                                setSheetOpen(true);
                              }}
                              aria-label={`Open ${handle} on X`}
                              title={handle}
                            >
                              <Avatar
                                src={e.avatarUrl}
                                handle={handle}
                                verified={e.verified}
                                size={Math.max(34, avatarSize)}
                              />

                              <span className="max-w-[210px] truncate text-[13px] font-semibold text-slate-200">
                                {chipText}
                              </span>

                              {/* tiny "you" hint is fine, but keep it subtle */}
                              {isMe ? (
                                <span className="ml-1 hidden sm:inline-flex rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                                  You
                                </span>
                              ) : null}
                            </a>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  ) : null}

                  {/* TICKER */}
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
                              'group inline-flex items-center gap-2 rounded-full border px-3 py-2 transition',
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
                            <MiniDot src={e.avatarUrl} handle={handle} verified={e.verified} />
                            <span className="max-w-[200px] truncate text-[13px] font-semibold text-slate-200">
                              {handle}
                            </span>
                            {e.name ? (
                              <span className="max-w-[220px] truncate text-[12px] text-slate-500">{e.name}</span>
                            ) : null}
                          </motion.a>
                        );
                      })}
                    </AnimatePresence>
                  ) : null}

                  {/* VIP */}
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
                              handle={handle}
                              verified={e.verified}
                              size={Math.max(30, avatarSize)}
                            />

                            <div className="min-w-0 leading-tight">
                              <div className="flex items-center gap-2">
                                <span className="max-w-[190px] truncate text-[13px] font-semibold text-slate-200">
                                  {handle}
                                </span>
                                {isMe ? (
                                  <span className="rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                                    You
                                  </span>
                                ) : null}
                              </div>
                              {e.name ? (
                                <div className="max-w-[240px] truncate text-[12px] text-slate-500">{e.name}</div>
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

        {/* live count */}
        <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <span className="xpot-live-dot h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Live</span>
          <span className="font-mono text-[12px] text-slate-200">{list.length}</span>
        </div>
      </div>

      {/* ✅ Desktop hover preview (X-like) */}
      <HoverCard
        e={hovered ?? ({ handle: '@unknown' } as any)}
        anchorEl={hoverAnchor}
        open={Boolean(hovered && hoverAnchor && !isMobile)}
        onClose={closeHover}
      />

      {/* ✅ Mobile tap sheet */}
      <MobileSheet
        open={sheetOpen}
        e={sheetEntry}
        onClose={() => {
          setSheetOpen(false);
          setSheetEntry(null);
        }}
      />
    </Outer>
  );
}
