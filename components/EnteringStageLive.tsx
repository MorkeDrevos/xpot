// components/EnteringStageLive.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Users } from 'lucide-react';

type EntryRow = {
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
  size = 26,
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
    </div>
  );
}

function buildLoop(entries: EntryRow[]) {
  const safe = Array.isArray(entries) ? entries.filter(e => Boolean(e?.handle)) : [];
  if (safe.length === 0) return [];

  if (safe.length < 8) {
    const times = Math.ceil(10 / safe.length);
    const out: EntryRow[] = [];
    for (let i = 0; i < times; i++) out.push(...safe);
    return out.slice(0, 16);
  }

  return safe.slice(0, 16);
}

export default function EnteringStageLive({
  entries,
  className = '',
  label = 'Entering the stage',
}: {
  entries: EntryRow[];
  className?: string;
  label?: string;
}) {
  const loop = useMemo(() => buildLoop(entries), [entries]);
  const has = loop.length > 0;

  const localHandle = useLocalHandle();

  // Tiny jitter so it never looks frozen
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setSeed(s => (s + 1) % 1000), 2200);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div
      className={[
        'relative overflow-hidden rounded-[26px] border border-white/10 bg-slate-950/20 ring-1 ring-white/[0.05]',
        className,
      ].join(' ')}
    >
      <style jsx global>{`
        @keyframes xpotMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes xpotBreath {
          0% {
            opacity: 0.55;
          }
          55% {
            opacity: 0.85;
          }
          100% {
            opacity: 0.55;
          }
        }
        .xpot-live-dot {
          animation: xpotBreath 1.45s ease-in-out infinite;
        }
        .xpot-marquee {
          display: flex;
          width: max-content;
          gap: 10px;
          animation: xpotMarquee 26s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .xpot-marquee {
            animation: none;
          }
          .xpot-live-dot {
            animation: none;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_18%_35%,rgba(56,189,248,0.10),transparent_60%),radial-gradient(circle_at_82%_30%,rgba(16,185,129,0.10),transparent_62%)]" />

      <div className="relative px-5 py-4">
        {/* header */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Users className="h-4 w-4 text-sky-200" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
              {label}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span className="xpot-live-dot h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            Live feed
          </div>
        </div>

        {/* body */}
        <div className="mt-3">
          {has ? (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3">
              {/* soft edge fades */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.95),transparent)]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-[linear-gradient(270deg,rgba(2,6,23,0.95),transparent)]" />

              {/* marquee track - doubled for seamless loop */}
              <div className="relative flex items-center gap-2">
                <div className="xpot-marquee" style={{ animationDelay: `${(seed % 6) * -0.18}s` }}>
                  {[...loop, ...loop].map((e, idx) => {
                    const handle = normalizeHandle(e?.handle);
                    const name = e?.name ? String(e.name).trim() : '';
                    const xUrl = toXProfileUrl(handle);

                    const key = e?.id ? String(e.id) : `${handle}-${e?.createdAt ?? ''}-${idx}`;
                    const isMe = Boolean(localHandle && normalizeHandle(localHandle) === handle);

                    return (
                      <a
                        key={key}
                        href={xUrl}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className={[
                          'inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 transition',
                          isMe
                            ? 'border-emerald-400/35 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.20),0_0_22px_rgba(16,185,129,0.18)]'
                            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
                        ].join(' ')}
                        title={isMe ? `${handle} - that’s you` : `Open ${handle} on X`}
                      >
                        <Avatar src={e?.avatarUrl} label={handle} />
                        <span className="flex min-w-0 flex-col leading-tight">
                          <span className="max-w-[140px] truncate text-[12px] text-slate-200">{handle}</span>
                          {name ? (
                            <span className="max-w-[140px] truncate text-[10px] text-slate-400">{name}</span>
                          ) : null}
                        </span>

                        {isMe ? (
                          <span className="ml-1 rounded-full border border-emerald-300/20 bg-emerald-950/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                            You
                          </span>
                        ) : (
                          <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400">
              Waiting for the first entries to appear in the feed.
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
            <span>Handle-first identity</span>
            <span className="opacity-70">Updates automatically</span>
          </div>
        </div>
      </div>
    </div>
  );
}
