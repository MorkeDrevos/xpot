// components/XpotSignInModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SignedIn, SignedOut, UserButton, useSignIn } from '@clerk/nextjs';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck, X, Sparkles, Radio } from 'lucide-react';

type XpotSignInModalProps = {
  afterSignOutUrl?: string;
  triggerClassName?: string;
  redirectUrlComplete?: string; // where to land after X auth
};

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full xpot-btn-vault xpot-focus-gold font-semibold transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GHOST =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition disabled:cursor-not-allowed disabled:opacity-40';

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function XpotSignInModal({
  afterSignOutUrl = '/',
  redirectUrlComplete = '/hub',
  triggerClassName = 'text-sm font-medium text-slate-200 hover:text-white transition',
}: XpotSignInModalProps) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const mounted = useMounted();

  const { isLoaded, signIn } = useSignIn();

  // Esc to close
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleContinueWithX() {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_x',
        redirectUrl: '/sso-callback',
        redirectUrlComplete,
      });
      setOpen(false);
    } catch (e) {
      console.error('[XPOT] X sign-in failed', e);
    }
  }

  const overlay = (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop: show the page, blurred + luxury vignette */}
          <motion.div
            key="xpot-backdrop"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0.12 } : { duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/55 backdrop-blur-xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_50%_110%,rgba(255,215,0,0.10),transparent_55%)]" />
            <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />
          </motion.div>

          {/* Modal shell */}
          <div className="absolute inset-0 flex items-center justify-center px-5 py-10">
            <motion.div
              key="xpot-x-signin"
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={
                reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 280, damping: 26 }
              }
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-[460px] overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/55 shadow-[0_60px_220px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Sign in with X"
            >
              {/* Luxury layers */}
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -inset-28 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.28),transparent_62%),radial-gradient(circle_at_85%_25%,rgba(56,189,248,0.18),transparent_62%),radial-gradient(circle_at_50%_110%,rgba(255,215,0,0.10),transparent_62%)]" />
              </div>

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 opacity-[0.55] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_35%,rgba(0,0,0,0.12))]" />
                <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]" />
              </div>

              {/* Header */}
              <div className="relative flex items-center justify-between gap-3 px-5 pt-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400/90 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-200">
                    Connect X
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="relative px-5 pb-5 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-semibold text-slate-100">
                      Sign in with X to enter XPOT
                    </h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                      One entry per X account per draw. No posting required.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                    <Radio className="h-3.5 w-3.5 text-emerald-200" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-200">
                      Live
                    </span>
                  </div>
                </div>

                {/* Trust card */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <ShieldCheck className="h-5 w-5 text-emerald-200" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-slate-100">Secure identity link</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        XPOT reads your public X handle only.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Value strip */}
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2">
                  <span className="inline-flex items-center gap-2 text-[11px] text-slate-300">
                    <Sparkles className="h-4 w-4 text-amber-200" />
                    No checkout, no tickets
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Holder access
                  </span>
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
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );

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

      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}

export { XpotSignInModal };
export default XpotSignInModal;
