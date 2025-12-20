// components/LiveEntrantsLounge.tsx
'use client';

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

function GhostRow({ count = 16 }: { count?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative h-7 w-7 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]"
        >
          <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.12),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.06),transparent)]" />
        </div>
      ))}
    </div>
  );
}

export default function LiveEntrantsLounge({
  entrants,
  hint = 'Live lobby - updates automatically',
}: {
  entrants: LiveEntrant[];
  hint?: string; // header hint only (NOT per-entrant subtitle)
}) {
  const reduceMotion = useReducedMotion();

  // Only show entries that already passed server-side checks.
  const safeEntrants = uniqByHandle(entrants).filter(e => !!e.avatarUrl);

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

      <div className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          </span>

          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Live entries (X handles)
          </span>

          <span className="text-[11px] text-slate-500">{hint}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500">Handles are shown, wallets stay self-custody.</span>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            {safeEntrants.length} live
          </span>
        </div>
      </div>

      {safeEntrants.length === 0 ? (
        <div className="relative z-10 overflow-hidden rounded-[22px] border border-slate-900/70 bg-slate-950/40 px-4 py-4">
          <div className="pointer-events-none absolute -inset-24 opacity-60 blur-3xl bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.10),transparent_62%)]" />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-100/90">No live entries right now.</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                Check back in a moment. When entries are live, you’ll see avatars and handles here.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                Preview
              </span>
              <GhostRow count={18} />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {safeEntrants.map((e, i) => {
            const handle = cleanHandle(e.handle);
            const avatar = e.avatarUrl!;
            const badge = (e.subtitle || '').trim();

            return (
              <motion.a
                key={handle.toLowerCase()}
                href={`https://x.com/${handle}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { delay: Math.min(i * 0.03, 0.35), duration: 0.35, ease: 'easeOut' }
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
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 bg-slate-900/60">
                    <img
                      src={avatar}
                      alt={`@${handle}`}
                      className="h-10 w-10 object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={ev => {
                        (ev.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] ring-2 ring-[#02020a]" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-mono text-[12px] text-slate-100/90">@{handle}</p>

                    {badge ? (
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-slate-400">{badge}</p>
                    ) : (
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-slate-500">Identity</p>
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    {e.verified && (
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
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
