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
        strategy: 'oauth_x', // X / Twitter
        // Where Clerk should send the user *during* OAuth:
        redirectUrl: '/dashboard/sso-callback',
        // Where Clerk should send the user *after* everything is done:
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      console.error('[XPOT] Failed to start X sign-in', err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl">
        {/* Header */}
        <header className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">
              XPOT access
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-50">
              Sign in with X to continue
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              XPOT uses your X identity as your single sign-on.
              No passwords, no emails – just your X account.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-4 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:border-slate-500 hover:bg-slate-900"
          >
            Close
          </button>
        </header>

        {/* XPOT logo */}
        <div className="mb-4 flex justify-center">
          <img
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            className="h-8"
          />
        </div>

        {/* Sign in button */}
        <button
          type="button"
          onClick={handleSignIn}
          className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 hover:bg-slate-100"
        >
          ✕ Continue with X / Twitter
        </button>

        <p className="mt-3 text-center text-[11px] text-slate-500">
          By continuing, you allow XPOT to use your X handle as your identity
          for daily draws.
        </p>
      </div>
    </div>
  );
}
