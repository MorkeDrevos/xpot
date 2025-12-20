// components/HubLockOverlay.tsx
'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useSignIn } from '@clerk/nextjs';

export default function HubLockOverlay({
  open,
  reason,
  showLinkX = false,
}: {
  open: boolean;
  reason?: string;
  showLinkX?: boolean;
}) {
  const reduce = useReducedMotion();
  const { isLoaded, signIn } = useSignIn();

  async function handleContinueWithX() {
    if (!isLoaded || !signIn) return;

    await signIn.authenticateWithRedirect({
      strategy: 'oauth_x',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/hub',
    });
  }

  const title = showLinkX ? 'Link X to continue' : 'Sign in to enter today’s draw';
  const sub =
    reason ??
    'One entry per X account per draw. Your identity is your entry. No posting required.';

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop (DO NOT close on click - keep it “locked”) */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />

          {/* Card */}
          <motion.div
            initial={{ y: 14, scale: 0.99, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.99, opacity: 0 }}
            transition={
              reduce
                ? { duration: 0.15 }
                : { type: 'spring', stiffness: 260, damping: 26 }
            }
            className="
              relative w-full max-w-[420px]
              overflow-hidden
              rounded-[28px]
              border border-white/10
              bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.10),transparent_55%),linear-gradient(to_bottom,rgba(2,6,23,0.88),rgba(2,6,23,0.66))]
              shadow-[0_30px_120px_rgba(0,0,0,0.78)]
              backdrop-blur-xl
            "
          >
            {/* subtle highlight line */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />

            <div className="relative p-6">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400/90 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-200">
                  XPOT access
                </span>
              </div>

              <h2 className="mt-4 text-center text-2xl font-semibold text-slate-100">
                {title}
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-center text-sm text-slate-300">
                {sub}
              </p>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleContinueWithX}
                  disabled={!isLoaded}
                  className="
                    w-full
                    inline-flex items-center justify-center
                    rounded-full
                    bg-sky-500/90
                    px-5 py-3
                    text-sm font-semibold text-slate-900
                    shadow-[0_18px_70px_rgba(56,189,248,0.25)]
                    hover:bg-sky-500
                    disabled:opacity-40
                  "
                >
                  {showLinkX ? 'Link X' : 'Sign in with X'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>

                <Link
                  href="/"
                  className="
                    w-full
                    inline-flex items-center justify-center
                    rounded-full
                    border border-white/10
                    bg-white/[0.04]
                    px-5 py-3
                    text-sm font-semibold text-slate-200
                    hover:bg-white/[0.08]
                  "
                >
                  Back to homepage
                </Link>
              </div>

              <p className="mt-4 text-center text-[11px] text-slate-500">
                Want a different X account? Switch on x.com first then come back here.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
