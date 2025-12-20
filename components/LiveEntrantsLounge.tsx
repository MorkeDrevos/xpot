// components/LiveEntrantsLounge.tsx
'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cleanHandle, type LiveEntrant } from '@/lib/live-entrants';

function uniqByHandle(list: LiveEntrant[]) {
  const seen = new Set<string>();
  const out: LiveEntrant[] = [];

  for (const e of list || []) {
    const h = cleanHandle(e?.handle || '');
    if (!h) continue;
    const key = h.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...e, handle: h });
  }

  return out;
}

function fmtCompact(n: number) {
  try {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  } catch {
    return String(n);
  }
}

function hashToHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function Orb({
  entrant,
  size = 34,
  showLiveDot = true,
  index = 0,
}: {
  entrant: LiveEntrant;
  size?: number;
  showLiveDot?: boolean;
  index?: number;
}) {
  const handle = cleanHandle(entrant.handle || '');
  const avatar = typeof entrant.avatarUrl === 'string' ? entrant.avatarUrl : '';
  const hue = hashToHue(handle || 'xpot');
  const initials = (handle || 'XP').slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: Math.min(index * 0.02, 0.25), duration: 0.28, ease: 'easeOut' }}
      className="relative shrink-0"
      style={{ width: size, height: size }}
      title={handle ? `@${handle}` : 'Live entrant'}
    >
      <div
        className="relative overflow-hidden rounded-full ring-1 ring-white/10"
        style={{
          width: size,
          height: size,
          backgroundImage: avatar
            ? undefined
            : `radial-gradient(circle at 30% 25%, hsla(${hue}, 95%, 70%, 0.35), transparent 58%),
               radial-gradient(circle at 80% 70%, hsla(${(hue + 70) % 360}, 95%, 70%, 0.22), transparent 62%),
               linear-gradient(180deg, rgba(15,23,42,0.65), rgba(2,6,23,0.78))`,
        }}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={handle ? `@${handle}` : 'entrant'}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={ev => {
              (ev.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-[11px] font-semibold text-slate-200/80">{initials}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.10),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.35),rgba(255,255,255,0.06),rgba(56,189,248,0.22),transparent)] opacity-70" />
      </div>

      {showLiveDot ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] ring-2 ring-[#02020a]"
          aria-hidden
        />
      ) : null}
    </motion.div>
  );
}

function GhostOrb({ size = 34, index = 0 }: { size?: number; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: Math.min(index * 0.02, 0.25), duration: 0.28, ease: 'easeOut' }}
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="
          relative h-full w-full overflow-hidden rounded-full
          ring-1 ring-white/10
          bg-[linear-gradient(180deg,rgba(15,23,42,0.55),rgba(2,6,23,0.72))]
        "
      >
        <div className="pointer-events-none absolute -inset-8 opacity-70 blur-2xl bg-[radial-gradient(circle_at_25%_25%,rgba(56,189,248,0.16),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.14),transparent_62%)]" />
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,0.07),transparent_55%)]" />
      </div>
    </motion.div>
  );
}

export default function LiveEntrantsLounge({
  entrants,
  hint = 'Optional - expand to view',
}: {
  entrants: LiveEntrant[];
  hint?: string; // header hint only (NOT per-entrant subtitle)
}) {
  const reduceMotion = useReducedMotion();

  const list = useMemo(() => uniqByHandle(entrants), [entrants]);
  const count = list.length;

  // Modern “preview rail” shows the most recent N handles as orbs (even if some have no avatarUrl).
  const rail = useMemo(() => list.slice(0, 12), [list]);

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-4 shadow-[0_30px_110px_rgba(0,0,0,0.55)] backdrop-blur">
      <div
        className="
          pointer-events-none absolute -inset-28 opacity-80 blur-3xl
          bg-[radial-gradient(circle_at_12%_10%,rgba(16,185,129,0.18),transparent_55%),
              radial-gradient(circle_at_86%_16%,rgba(139,92,246,0.16),transparent_58%),
              radial-gradient(circle_at_82%_92%,rgba(56,189,248,0.12),transparent_60%)]
        "
      />

      {/* Header */}
      <div className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Live entries (X handles)
              </span>

              <span className="text-[11px] text-slate-500">{hint}</span>

              <span className="hidden sm:inline text-slate-700">•</span>

              <span className="hidden sm:inline text-[11px] text-slate-500">
                Handles are shown, wallets stay self-custody.
              </span>
            </div>

            {/* Avatar rail */}
            <div className="mt-2 flex items-center gap-2">
              {count === 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="rounded-full ring-2 ring-[#02020a]">
                        <GhostOrb size={28} index={i} />
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500">No live entries yet</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {rail.map((e, i) => (
                      <div key={cleanHandle(e.handle).toLowerCase()} className="rounded-full ring-2 ring-[#02020a]">
                        <Orb entrant={e} size={28} showLiveDot={i < 6} index={i} />
                      </div>
                    ))}
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Latest <span className="text-slate-300">{Math.min(count, rail.length)}</span>
                    {count > rail.length ? (
                      <>
                        {' '}
                        • <span className="text-slate-300">+{count - rail.length}</span> more
                      </>
                    ) : null}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <span
          className="
            inline-flex items-center gap-2 rounded-full
            border border-white/10 bg-white/[0.03]
            px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]
            text-slate-200
          "
          title="Live entrants count"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          {count === 0 ? '0 live' : `${fmtCompact(count)} live`}
        </span>
      </div>

      {/* Body */}
      {count === 0 ? (
        <div className="relative z-10 overflow-hidden rounded-[22px] border border-slate-900/70 bg-slate-950/40 px-4 py-5">
          <div className="pointer-events-none absolute -inset-24 opacity-60 blur-3xl bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(circle_at_80%_40%,rgba(16,185,129,0.10),transparent_60%)]" />

          <p className="relative font-semibold text-slate-200/90">No live entries right now.</p>
          <p className="relative mt-1 text-[12px] leading-relaxed text-slate-500">
            Check back in a moment. When entries are live, you’ll see them here as avatar orbs and handles.
          </p>

          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Preview</span>
            <span className="h-px w-10 bg-white/10" />
            <div className="flex -space-x-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-full ring-2 ring-[#02020a]">
                  <GhostOrb size={30} index={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e, i) => {
            const handle = cleanHandle(e.handle);
            const badge = (e.subtitle || '').trim();
            const followers = typeof e.followers === 'number' ? e.followers : null;
            const verified = !!e.verified;

            return (
              <motion.a
                key={handle.toLowerCase()}
                href={`https://x.com/${handle}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { delay: Math.min(i * 0.02, 0.25), duration: 0.32, ease: 'easeOut' }
                }
                className="
                  group relative overflow-hidden rounded-[22px]
                  border border-slate-900/70 bg-slate-950/45
                  px-4 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.55)]
                  hover:bg-slate-950/70 transition
                "
                title={`Open @${handle} on X`}
              >
                <div
                  className="
                    pointer-events-none absolute -inset-24 opacity-0 blur-3xl transition
                    group-hover:opacity-80
                    bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,0.22),transparent_55%),
                        radial-gradient(circle_at_78%_20%,rgba(56,189,248,0.14),transparent_58%)]
                  "
                />

                <div className="relative z-10 flex items-center gap-3">
                  <Orb entrant={e} size={42} showLiveDot />

                  <div className="min-w-0">
                    <p className="truncate font-mono text-[12px] text-slate-100/90">@{handle}</p>

                    {badge ? (
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-slate-400">{badge}</p>
                    ) : (
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        {verified ? 'Verified' : 'Identity'}
                        {followers != null ? ` • ${fmtCompact(followers)} followers` : ''}
                      </p>
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    {verified ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                    )}
                    <span className="text-[10px] uppercase tracking-[0.22em] text-slate-600">View</span>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.35),rgba(255,255,255,0.06),rgba(56,189,248,0.25),transparent)] opacity-70" />
              </motion.a>
            );
          })}
        </div>
      )}
    </div>
  );
}
