'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';

type XLoginOverlayProps = {
  visible: boolean;
};

export function XLoginOverlay({ visible }: XLoginOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="
        fixed inset-0 z-40
        flex items-center justify-center
        bg-black/70
        backdrop-blur-2xl
      "
    >
      {/* Subtle vignette glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(244,244,245,0.16),_transparent_55%)]" />

      {/* Card */}
      <div
        className="
          relative pointer-events-auto
          w-full max-w-xl mx-4
          rounded-3xl
          border border-white/10
          bg-slate-950/80
          shadow-[0_0_60px_rgba(15,23,42,0.9)]
          overflow-hidden
        "
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-sky-500" />

        <div className="relative px-8 pt-8 pb-6 sm:px-10 sm:pt-10 sm:pb-8">
          {/* Logo and badge */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-2xl bg-slate-900/70 border border-cyan-400/30 flex items-center justify-center">
                {/* XPOT logo (fallback to text if image missing) */}
                <Image
                  src="/xpot-logo.svg"
                  alt="XPOT"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-400/80">
                  XPOT access
                </span>
                <span className="text-sm text-slate-400">
                  One identity. One daily XPOT draw.
                </span>
              </div>
            </div>

            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              X login required
            </span>
          </div>

          {/* Headline + copy (your existing text, unchanged) */}
          <div className="space-y-3 mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
              Sign in with X to continue
            </h1>
            <p className="text-sm text-slate-300/90 leading-relaxed">
              XPOT links each wallet to a verified X account so every draw is
              tied to a real handle.
            </p>
          </div>

          {/* Why X login box */}
          <div className="mb-7 rounded-2xl border border-slate-700/80 bg-slate-900/70 px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-slate-400 mb-3">
              Why X login?
            </p>
            <ul className="space-y-1.5 text-sm text-slate-200">
              <li className="flex gap-2">
                <span className="mt-[5px] h-1 w-1 rounded-full bg-cyan-400" />
                <span>One XPOT identity per X account.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-[5px] h-1 w-1 rounded-full bg-cyan-400" />
                <span>Winners revealed by X handle.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-[5px] h-1 w-1 rounded-full bg-cyan-400" />
                <span>Your wallet always remains self-custodied.</span>
              </li>
            </ul>
          </div>

          {/* X button */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => signIn('twitter')}
              className="
                group relative w-full
                inline-flex items-center justify-center gap-3
                rounded-2xl px-4 py-3.5
                text-sm sm:text-base font-semibold
                bg-white text-slate-900
                shadow-lg shadow-cyan-500/25
                hover:bg-slate-100
                hover:-translate-y-0.5
                transition
              "
            >
              <span
                className="
                  inline-flex h-7 w-7 items-center justify-center
                  rounded-full bg-black text-white text-sm
                "
              >
                𝕏
              </span>
              <span>Continue with X (Twitter)</span>

              <span
                className="
                  absolute inset-0 -z-10
                  rounded-2xl
                  bg-gradient-to-r from-cyan-400/40 via-emerald-400/40 to-sky-500/40
                  opacity-0 group-hover:opacity-100
                  blur-xl
                  transition
                "
              />
            </button>

            <p className="text-[11px] leading-relaxed text-slate-400 text-center">
              We never post for you. XPOT only reads your public profile
              (handle, name, avatar) and links it to your XPOT wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
