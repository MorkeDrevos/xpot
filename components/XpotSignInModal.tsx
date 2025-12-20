// components/XpotSignInModal.tsx
'use client';

import { useState } from 'react';
import { SignedIn, SignedOut, UserButton, useSignIn } from '@clerk/nextjs';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, X, ShieldCheck } from 'lucide-react';

export type XpotSignInModalProps = {
  afterSignOutUrl?: string;
  triggerClassName?: string;

  // Where to land after auth (defaults to /hub)
  redirectUrlComplete?: string;
};

export default function XpotSignInModal({
  afterSignOutUrl = '/',
  redirectUrlComplete = '/hub',
  triggerClassName = 'text-sm font-medium text-slate-200 hover:text-white transition',
}: XpotSignInModalProps) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const { isLoaded, signIn } = useSignIn();

  async function handleContinueWithX() {
    if (!isLoaded || !signIn) return;

    // Optional: close immediately for “snappy” feel
    setOpen(false);

    await signIn.authenticateWithRedirect({
      strategy: 'oauth_x',
      redirectUrl: '/sso-callback',
      redirectUrlComplete,
    });
  }

  return (
    <>
      <SignedOut>
        <button onClick={() => setOpen(true)} className={triggerClassName}>
          Sign in
        </button>
      </SignedOut>

      <SignedIn>
        <UserButton afterSignOutUrl={afterSignOutUrl} />
      </SignedIn>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-modal="true"
            role="dialog"
          >
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
            />

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
              onClick={e => e.stopPropagation()}
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
                {/* Pill */}
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-400/90 shadow-[0_0_0_3px_rgba(56,189,248,0.14)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-200">
                    XPOT identity
                  </span>
                </div>

                <h2 className="mt-4 text-center text-2xl font-semibold text-slate-100">
                  Sign in with X
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-center text-sm text-slate-300">
                  Connect your X identity to enter today’s XPOT.
                </p>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleContinueWithX}
                    disabled={!isLoaded}
                    className="
                      w-full inline-flex items-center justify-center gap-2
                      rounded-full
                      bg-sky-500/90
                      px-5 py-3
                      text-sm font-semibold text-slate-900
                      shadow-[0_18px_70px_rgba(56,189,248,0.25)]
                      hover:bg-sky-500
                      disabled:opacity-40
                    "
                  >
                    <X className="h-4 w-4" />
                    Continue with X
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="
                      w-full inline-flex items-center justify-center
                      rounded-full
                      border border-white/10
                      bg-white/[0.04]
                      px-5 py-3
                      text-sm font-semibold text-slate-200
                      hover:bg-white/[0.08]
                    "
                  >
                    Not now
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                      <ShieldCheck className="h-4 w-4 text-slate-200" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200">
                        One entry per X account per draw
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        No posting required. If you want a different account, switch on x.com first then come back.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-center text-[11px] text-slate-500">
                  You can unlink and re-link later in your account settings.
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
