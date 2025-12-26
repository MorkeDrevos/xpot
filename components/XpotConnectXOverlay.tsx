'use client';

import { useEffect, useMemo, useState } from 'react';
import { SignedIn, SignedOut, UserButton, useSignIn } from '@clerk/nextjs';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion';
import { ArrowRight, ShieldCheck, X, Sparkles, Radio } from 'lucide-react';

type Props = {
  afterSignOutUrl?: string;
  triggerClassName?: string;
  redirectUrlComplete?: string;
  title?: string;
  subtitle?: string;
};

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full xpot-btn-vault xpot-focus-gold font-semibold transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GHOST =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition disabled:cursor-not-allowed disabled:opacity-40';

export default function XpotConnectXOverlay({
  afterSignOutUrl = '/',
  redirectUrlComplete = '/hub',
  triggerClassName = 'text-sm font-medium text-slate-200 hover:text-white transition',
  title = 'Access the XPOT ecosystem',
  subtitle = 'Connect X to link identity. No posting required.',
}: Props) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const { isLoaded, signIn } = useSignIn();

  // IMPORTANT: give Framer Motion a properly typed Transition
  const transition = useMemo<Transition>(() => {
    if (reduce) return { duration: 0.15 };
    return { type: 'spring', stiffness: 260, damping: 26 };
  }, [reduce]);

  // lock scroll while open
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
          <div className="fixed inset-0 z-[9999]">
            <style jsx global>{`
              @keyframes xpotOverlaySweep {
                0% { transform: translateX(-140%) rotate(12deg); opacity: 0; }
                12% { opacity: 0.35; }
                60% { opacity: 0.14; }
                100% { transform: translateX(160%) rotate(12deg); opacity: 0; }
              }
              @keyframes xpotOverlayFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-6px); }
              }
              .xpot-overlay-sweep::before{
                content:"";
                position:absolute;
                top:-55%;
                left:-60%;
                width:55%;
                height:240%;
                opacity:0;
                transform: rotate(12deg);
                background: linear-gradient(
                  90deg,
                  transparent,
                  rgba(255,255,255,0.10),
                  rgba(56,189,248,0.10),
                  rgba(16,185,129,0.09),
                  rgba(255,215,0,0.06),
                  transparent
                );
                animation: xpotOverlaySweep 1.8s ease-in-out infinite;
                mix-blend-mode: screen;
                pointer-events:none;
              }
            `}</style>

            {/* Backdrop: show page behind + blur */}
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute inset-0 backdrop-blur-2xl" />
              <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.18),transparent_58%),radial-gradient(circle_at_85%_25%,rgba(56,189,248,0.14),transparent_62%),radial-gradient(circle_at_55%_92%,rgba(255,215,0,0.08),transparent_60%)]" />
            </button>

            {/* Dialog */}
            <div className="relative mx-auto flex h-full max-w-[520px] items-center px-5">
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.99 }}
                transition={transition}
                role="dialog"
                aria-modal="true"
                aria-label="Connect X"
                onClick={e => e.stopPropagation()}
                className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/55 shadow-[0_60px_180px_rgba(0,0,0,0.75)] backdrop-blur-xl"
              >
                <div className="xpot-overlay-sweep absolute inset-0" />

                <div className="pointer-events-none absolute -inset-24 opacity-75 blur-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.22),transparent_60%),radial-gradient(circle_at_82%_28%,rgba(56,189,248,0.16),transparent_62%),radial-gradient(circle_at_52%_100%,rgba(255,215,0,0.09),transparent_64%)]" />

                <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-white/10" />
                <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-amber-300/10" />

                <div className="relative p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      <span className="inline-flex h-2 w-2 items-center justify-center rounded-full bg-emerald-400/90 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-200">
                        Protocol access
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-[20px] font-semibold text-slate-100">{title}</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{subtitle}</p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]"
                        style={{ animation: reduce ? 'none' : 'xpotOverlayFloat 4.8s ease-in-out infinite' }}
                      >
                        <ShieldCheck className="h-5 w-5 text-emerald-200" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-100">Secure identity link</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          XPOT reads your public handle only and ties it to your entries.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                            <Radio className="h-3.5 w-3.5 text-emerald-200" />
                            One identity
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                            Zero friction
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
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

                  <p className="mt-5 text-center text-[11px] text-slate-500">
                    Want a different X account? Switch on x.com first then come back.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
