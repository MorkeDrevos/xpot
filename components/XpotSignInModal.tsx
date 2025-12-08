// components/XpotSignInModal.tsx
'use client';

import { useSignIn } from '@clerk/nextjs';

type XpotSignInModalProps = {
  open: boolean;
  onClose: () => void;
};

export function XpotSignInModal({ open, onClose }: XpotSignInModalProps) {
  const { signIn, isLoaded } = useSignIn();

  if (!open) return null;

  async function handleSignIn() {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_x',
        redirectUrl: '/dashboard/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      console.error('[XPOT] Failed to start X sign-in', err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl">
      {/* Glow behind card */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800/80 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.10),transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.08),transparent_60%),#020617] px-6 pb-6 pt-5 shadow-[0_40px_140px_rgba(0,0,0,0.95)]">
        {/* Top row: pill + close */}
        <div className="mb-4 flex items-start justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              XPOT access
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700/70 px-3 py-1 text-[11px] font-medium text-slate-400 hover:border-slate-500 hover:bg-slate-900 hover:text-slate-100 transition"
          >
            Close
          </button>
        </div>

        {/* Logo + title */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/80">
            <img
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              className="h-5"
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-50">
              Sign in with X to continue
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Use your X identity as your single sign-on. No passwords, no
              emails – just your X account.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-slate-700/70 to-transparent" />

        {/* CTA button */}
        <button
          type="button"
          onClick={handleSignIn}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(34,197,94,0.35)] hover:brightness-105 active:translate-y-[1px] transition"
        >
          <span className="text-base">✕</span>
          <span>Continue with X / Twitter</span>
        </button>

        {/* Microcopy */}
        <div className="mt-3 space-y-1 text-[11px] text-slate-500">
          <p className="text-center">
            XPOT only uses your public profile and handle to link your wallet
            to a single X identity.
          </p>
          <p className="text-center text-slate-600">
            We never post on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}
