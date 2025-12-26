// components/HubLockOverlay.tsx
'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck, X as XIcon, Radio, Sparkles } from 'lucide-react';
import { useSignIn } from '@clerk/nextjs';

const BTN_GHOST =
  'inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]';

const CTA_PRIMARY_SIBLING =
  [
    'group relative w-full h-11',
    'inline-flex items-center justify-center gap-2',
    'rounded-full',
    'bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]',
    'border border-white/15',
    'text-[13px] font-semibold text-slate-100',
    'shadow-[0_10px_40px_rgba(0,0,0,0.45)]',
    'transition',
    'hover:border-emerald-300/40',
    'hover:text-white',
    'hover:shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_20px_60px_rgba(0,0,0,0.55)]',
    'active:scale-[0.985]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' ');

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

  const title = showLinkX ? 'Link X to continue' : 'Sign in with X';
  const sub = reason ?? 'Identity is the entry. One X account per draw. No posting required.';

  const transition = reduce
    ? ({ duration: 0.15 } as const)
    : ({ type: 'spring' as const, stiffness: 260, damping: 26 } as const);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[95]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop: show page behind + blur */}
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 backdrop-blur-2xl" />
          <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(56,189,248,0.14),transparent_60%),radial-gradient(circle_at_52%_92%,rgba(255,215,0,0.08),transparent_60%)]" />

          {/* Dialog wrapper */}
          <div className="relative mx-auto flex h-full max-w-[560px] items-center px-5">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="XPOT X access"
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.99 }}
              transition={transition}
              className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/55 shadow-[0_60px_180px_rgba(0,0,0,0.75)] backdrop-blur-xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Luxury bloom */}
              <div className="pointer-events-none absolute -inset-24 opacity-75 blur-3xl bg-[radial-gradient(circle_at_18%_22%,rgba(16,185,129,0.22),transparent_60%),radial-gradient(circle_at_84%_28%,rgba(56,189,248,0.16),transparent_62%),radial-gradient(circle_at_52%_100%,rgba(255,215,0,0.09),transparent_64%)]" />
              <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-white/10" />
              <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-amber-300/10" />

              <div className="relative p-6">
                {/* Header row (wallet-modal vibe) */}
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                    XPOT access
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-200" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                      Secure
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div className="mt-3">
                  <h2 className="text-[20px] font-semibold text-slate-100">{title}</h2>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{sub}</p>
                </div>

                {/* Info panel (like wallet modal) */}
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                      <XIcon className="h-5 w-5 text-slate-200" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-slate-100">Connect your identity</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        We read your public handle only. Your entry is tied to your account.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                          <Radio className="h-3.5 w-3.5 text-emerald-200" />
                          One identity
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                          <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                          Zero posting
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={handleContinueWithX}
                    disabled={!isLoaded}
                    className={CTA_PRIMARY_SIBLING}
                  >
                    <XIcon className="h-4 w-4 opacity-90 group-hover:opacity-100" />
                    <span>{showLinkX ? 'Link X' : 'Continue with X'}</span>
                    <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <Link href="/" className={BTN_GHOST}>
                    Back to homepage
                  </Link>
                </div>

                <p className="mt-4 text-center text-[11px] text-slate-500">
                  Want a different X account? Switch on x.com first then come back.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
