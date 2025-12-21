// components/HubLockOverlay.tsx
'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck, X as XIcon } from 'lucide-react';
import { useSignIn } from '@clerk/nextjs';

const BTN_PRIMARY =
  'inline-flex w-full items-center justify-center rounded-full xpot-btn-vault xpot-focus-gold px-5 py-3 text-sm font-semibold transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GHOST =
  'inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10';

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
          {/* Backdrop (locked) */}
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
              rounded-[26px] border border-white/10
              bg-[linear-gradient(to_bottom,rgba(2,6,23,0.88),rgba(2,6,23,0.62))]
              shadow-[0_30px_120px_rgba(0,0,0,0.78)]
              overflow-hidden
            "
          >
            {/* Ambient glows (same vibe as PremiumWalletModal) */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-[18%] h-[320px] w-[320px] rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.10),transparent_60%)]" />

            <div className="relative p-5">
              {/* Top row */}
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400/90 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-200">
                    XPOT access
                  </span>
                </div>

                {/* (Optional) “locked” hint badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-200" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                    Secure
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="mt-4">
                <h2 className="text-[18px] font-semibold text-slate-100">{title}</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{sub}</p>
              </div>

              {/* Actions */}
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleContinueWithX}
                  disabled={!isLoaded}
                  className={BTN_PRIMARY}
                >
                  <span className="inline-flex items-center gap-2">
                    <XIcon className="h-4 w-4" />
                    {showLinkX ? 'Link X' : 'Sign in with X'}
                  </span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>

                <Link href="/" className={BTN_GHOST}>
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
