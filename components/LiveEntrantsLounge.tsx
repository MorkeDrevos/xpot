'use client';

import { motion, useReducedMotion } from 'framer-motion';

export type LiveEntrant = {
  handle: string;
  avatarUrl?: string; // optional (use your own later)
  verified?: boolean; // optional
  subtitle?: string;
};

function cleanHandle(h: string) {
  return h.replace(/^@/, '').trim();
}

// Public avatar provider (no auth). Swap later to your own cached proxy endpoint.
function avatarFromHandle(handle: string) {
  const h = cleanHandle(handle);
  return `https://unavatar.io/twitter/${encodeURIComponent(h)}`;
}

export default function LiveEntrantsLounge({
  entrants,
  subtitle = 'Optional - expand to view',
}: {
  entrants: LiveEntrant[];
  subtitle?: string;
}) {
  const reduceMotion = useReducedMotion();

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

          <span className="text-[11px] text-slate-500">{subtitle}</span>
        </div>

        <span className="text-[11px] text-slate-500">Handles are shown, wallets stay self-custody.</span>
      </div>

      <div className="relative z-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entrants.map((e, i) => {
          const handle = cleanHandle(e.handle);
          const avatar = e.avatarUrl || avatarFromHandle(handle);

          return (
            <motion.a
              key={handle}
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
              {/* Hover aura */}
              <div
                className="
                  pointer-events-none absolute -inset-24 opacity-0 blur-3xl transition
                  group-hover:opacity-80
                  bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,0.22),transparent_55%),
                      radial-gradient(circle_at_78%_20%,rgba(56,189,248,0.14),transparent_58%)]
                "
              />

              <div className="relative z-10 flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                  <img
                    src={avatar}
                    alt={`@${handle}`}
                    className="h-10 w-10 object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(ev) => {
                      // fallback: blank avatar
                      (ev.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                    }}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] ring-2 ring-[#02020a]" />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-mono text-[12px] text-slate-100/90">@{handle}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    Identity
                  </p>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  {e.verified && (
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                  )}
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-600">View</span>
                </div>
              </div>

              {/* Subtle bottom edge highlight */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.35),rgba(255,255,255,0.06),rgba(56,189,248,0.25),transparent)] opacity-70" />
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
