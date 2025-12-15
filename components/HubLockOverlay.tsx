// components/HubLockOverlay.tsx
'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, ArrowRight } from 'lucide-react';

import XpotLogoLottie from '@/components/XpotLogoLottie';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-200 hover:bg-slate-800 transition';

export default function HubLockOverlay({
  open,
  reason = 'Sign in with X to access the Holder Dashboard.',
  showLinkX = false,
}: {
  open: boolean;
  reason?: string;
  showLinkX?: boolean;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />

          {/* Glow */}
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute left-1/2 top-[38%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="absolute left-[20%] top-[55%] h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-3xl" />
          </div>

          {/* Card */}
          <motion.div
            initial={{ y: 18, scale: 0.985, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.99, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="
              relative w-full max-w-[520px]
              rounded-[32px] border border-white/10
              bg-gradient-to-b from-slate-950/80 to-slate-950/55
              shadow-[0_30px_120px_rgba(0,0,0,0.75)]
              backdrop-blur-xl
              overflow-hidden
            "
          >
            {/* Subtle ambient */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-[18%] h-[300px] w-[300px] rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative px-6 py-6 sm:px-7 sm:py-7">
              {/* XPOT brand row (logo + chips) */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <XpotLogoLottie className="h-8 w-auto" height={32} />
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                    XPOT
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    <Lock className="h-4 w-4 text-amber-200" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                      Access restricted
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    <X className="h-4 w-4 text-slate-200" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                      X-powered identity
                    </span>
                  </div>
                </div>
              </div>

              <h2 className="mt-5 text-[28px] font-semibold leading-tight text-slate-100">
                Holder Dashboard is locked
              </h2>
              <p className="mt-2 text-sm text-slate-300">{reason}</p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs text-slate-300">XPOT ties each entry to:</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400/90" />
                    Your X handle
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400/90" />
                    Your Solana wallet
                  </li>
                </ul>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/sign-in?redirect_url=/hub"
                  className={`${BTN_PRIMARY} h-12 px-6 text-sm`}
                >
                  {showLinkX ? 'Link X to continue' : 'Continue with X'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>

                <Link href="/" className={`${BTN_UTILITY} h-12 px-6 text-sm`}>
                  Back to homepage
                </Link>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                Pre-launch note: this lock is UI-first, but all sensitive actions stay protected on the
                server.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
