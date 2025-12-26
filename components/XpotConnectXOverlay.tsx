// components/HubLockOverlay.tsx
'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion';
import { ArrowRight, ShieldCheck, X as XIcon, Sparkles, Lock } from 'lucide-react';
import { useSignIn } from '@clerk/nextjs';

const BTN_PRIMARY =
  'group inline-flex w-full items-center justify-center rounded-full xpot-btn-vault xpot-focus-gold px-5 py-3 text-sm font-semibold transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GHOST =
  'inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.07]';

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

  const transition: Transition = reduce
    ? { duration: 0.15 }
    : { type: 'spring', stiffness: 260, damping: 26 };

  async function handleContinueWithX() {
    if (!isLoaded || !signIn) return;

    await signIn.authenticateWithRedirect({
      strategy: 'oauth_x',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/hub',
    });
  }

  const title = showLinkX ? 'Link X to unlock the dashboard' : 'Connect X to enter today’s draw';
  const sub =
    reason ??
    'One entry per X account per draw. XPOT reads your public handle only. No posting required.';

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Global styles for premium overlay texture */}
          <style jsx global>{`
            @keyframes xpotOverlaySweep {
              0% { transform: translateX(-140%) rotate(10deg); opacity: 0; }
              12% { opacity: 0.35; }
              55% { opacity: 0.14; }
              100% { transform: translateX(160%) rotate(10deg); opacity: 0; }
            }
            @keyframes xpotOverlayPulse {
              0%, 100% { opacity: 0.55; }
              50% { opacity: 0.85; }
            }
            .xpot-overlay-noise {
              background-image:
                radial-gradient(circle at 20% 12%, rgba(56,189,248,0.18), transparent 55%),
                radial-gradient(circle at 85% 30%, rgba(217,70,239,0.14), transparent 58%),
                radial-gradient(circle at 50% 95%, rgba(245,158,11,0.10), transparent 60%),
                radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06), transparent 55%);
            }
            .xpot-overlay-sweep::before{
              content:"";
              position:absolute;
              top:-55%;
              left:-60%;
              width:55%;
              height:240%;
              opacity:0;
              transform: rotate(10deg);
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255,255,255,0.10),
                rgba(56,189,248,0.10),
                rgba(16,185,129,0.08),
                transparent
              );
              animation: xpotOverlaySweep 1.7s ease-in-out infinite;
              mix-blend-mode: screen;
              pointer-events:none;
            }
          `}</style>

          {/* Backdrop: keep page visible, blur it, add premium vignette (no "cheap black sheet") */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-2xl" />
          <div className="pointer-events-none absolute inset-0 xpot-overlay-noise opacity-90" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,0,0,0.80),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(0,0,0,0.60),transparent_55%)]" />

          {/* Card */}
          <motion.div
            initial={{ y: 18, scale: 0.985, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.99, opacity: 0 }}
            transition={transition}
            className="
              relative w-full max-w-[460px]
              overflow-hidden rounded-[30px]
              border border-white/10
              bg-[linear-gradient(to_bottom,rgba(2,6,23,0.78),rgba(2,6,23,0.56))]
              shadow-[0_50px_160px_rgba(0,0,0,0.85)]
              backdrop-blur-xl
            "
          >
            <div className="xpot-overlay-sweep absolute inset-0" />

            {/* Inner glows */}
            <div className="pointer-events-none absolute -top-28 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-sky-500/12 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-[12%] h-[420px] w-[420px] rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.10),transparent_60%)]" />

            {/* Header strip */}
            <div className="relative px-6 pt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <span
                    className="h-2 w-2 rounded-full bg-emerald-400/90 shadow-[0_0_0_5px_rgba(16,185,129,0.10)]"
                    style={{ animation: reduce ? 'none' : 'xpotOverlayPulse 1.8s ease-in-out infinite' }}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-200">
                    XPOT ACCESS
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-200" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                    Secure
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <h2 className="text-[19px] font-semibold text-slate-100">{title}</h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">{sub}</p>
              </div>

              {/* Value props */}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniPill icon={<Lock className="h-4 w-4" />} title="Gated" desc="X identity required" />
                <MiniPill icon={<Sparkles className="h-4 w-4" />} title="Clean" desc="No posting needed" />
                <MiniPill icon={<ShieldCheck className="h-4 w-4" />} title="Safe" desc="Public handle only" />
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleContinueWithX}
                  disabled={!isLoaded}
                  className={BTN_PRIMARY}
                >
                  <span className="inline-flex items-center gap-2">
                    <XIcon className="h-4 w-4" />
                    {showLinkX ? 'Link X' : 'Continue with X'}
                  </span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                <Link href="/" className={BTN_GHOST}>
                  Back to homepage
                </Link>
              </div>

              <p className="mt-5 pb-6 text-center text-[11px] text-slate-500">
                Switching accounts? Change it on x.com then return here.
              </p>
            </div>

            {/* Bottom hairline */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MiniPill({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-200">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-100">{title}</p>
          <p className="mt-0.5 text-[10.5px] text-slate-500">{desc}</p>
        </div>
      </div>
    </div>
  );
}
