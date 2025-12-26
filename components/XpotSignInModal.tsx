// components/XpotSignInModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, UserButton, useSignIn } from '@clerk/nextjs';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck, X } from 'lucide-react';

import Modal from '@/components/Modal';

type XpotSignInModalProps = {
  afterSignOutUrl?: string;
  triggerClassName?: string;
  redirectUrlComplete?: string; // where to land after X auth
};

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full xpot-btn-vault xpot-focus-gold font-semibold transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GHOST =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition disabled:cursor-not-allowed disabled:opacity-40';

function XpotSignInModal({
  afterSignOutUrl = '/',
  redirectUrlComplete = '/hub',
  triggerClassName = 'text-sm font-medium text-slate-200 hover:text-white transition',
}: XpotSignInModalProps) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const { isLoaded, signIn } = useSignIn();

  // If user finishes auth in another flow and comes back signed-in, close this modal
  useEffect(() => {
    // no-op unless modal is open
    if (!open) return;
    // Clerk state is best checked via SignedIn/SignedOut in render,
    // so we just keep this effect minimal.
  }, [open]);

  async function handleContinueWithX() {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_x',
        redirectUrl: '/sso-callback',
        redirectUrlComplete,
      });
      // Note: browser will redirect. If it doesn't (rare), we still close.
      setOpen(false);
    } catch (e) {
      console.error('[XPOT] X sign-in failed', e);
    }
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
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            tone="xpot-light"
            maxWidthClassName="max-w-[420px]"
            hideHeader
            closeOnBackdrop
            closeOnEsc
            zIndexClassName="z-[95]"
            ariaLabel="Sign in with X"
            containerClassName="rounded-[26px]"
            contentClassName="p-5"
          >
            <motion.div
              key="xpot-x-signin"
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={
                reduce
                  ? { duration: 0.15 }
                  : { type: 'spring', stiffness: 260, damping: 26 }
              }
              onClick={e => e.stopPropagation()}
            >
              {/* Top row */}
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400/90 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-200">
                    Connect X
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title */}
              <div className="mt-4">
                <h3 className="text-[18px] font-semibold text-slate-100">
                  Sign in with X to enter XPOT
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                  One entry per X account per draw. No posting required.
                </p>
              </div>

              {/* Trust / status card */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <ShieldCheck className="h-5 w-5 text-emerald-200" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-100">
                      Secure identity link
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      XPOT reads your public X handle only.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={handleContinueWithX}
                  disabled={!isLoaded}
                  className={`${BTN_PRIMARY} h-11 w-full text-[13px]`}
                >
                  Continue with X
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={`${BTN_GHOST} h-10 w-full text-[12px]`}
                >
                  Not now
                </button>
              </div>

              <p className="mt-4 text-center text-[11px] text-slate-500">
                Want a different X account? Switch on x.com first then come back.
              </p>
            </motion.div>
          </Modal>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export { XpotSignInModal };
export default XpotSignInModal;
