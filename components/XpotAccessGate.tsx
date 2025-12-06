// components/XpotAccessGate.tsx
'use client';

import { ReactNode } from 'react';
import { SignedOut, useSignIn } from '@clerk/nextjs';
import Image from 'next/image';

type XpotAccessGateProps = {
  children: ReactNode;
};

export default function XpotAccessGate({ children }: XpotAccessGateProps) {
  return (
    <div className="relative min-h-screen">
      {/* Dashboard always renders */}
      <div className="relative z-0">{children}</div>

      {/* Frosted X login overlay only when logged out */}
      <SignedOut>
        <XpotXLoginOverlay />
      </SignedOut>
    </div>
  );
}

// ─────────────────────────────────────────────
// XPOT frosted X-login overlay
// ─────────────────────────────────────────────

function XpotXLoginOverlay() {
  const { signIn, isLoaded } = useSignIn();

  async function handleXLogin() {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_twitter', // X / Twitter in Clerk
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      console.error('[XPOT] X login failed', err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[26px] relative">
      {/* Atmosphere glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/18 blur-[140px]" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-[420px] w-[420px] rounded-full bg-cyan-500/14 blur-[160px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#020617]/82 p-6 shadow-[0_60px_180px_rgba(0,0,0,0.95)] backdrop-blur-[22px] ring-1 ring-white/5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={120}
            height={32}
            priority
          />
          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            X identity
          </span>
        </div>

        {/* Copy */}
        <h1 className="text-base font-medium text-slate-100">
          Your X handle is your XPOT identity.
        </h1>
        <p className="mt-1 text-[13px] text-slate-400">
          No email. No passwords. Just your verified X account.
        </p>

        {/* Button */}
        <button
          type="button"
          onClick={handleXLogin}
          className="mt-4 group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(255,255,255,0.14)] transition hover:shadow-[0_0_80px_rgba(255,255,255,0.3)]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">
            X
          </span>
          <span>Continue with X / Twitter</span>
        </button>

        {/* Footer */}
        <p className="mt-3 text-[11px] text-slate-500">
          One XPOT identity per X account. Winners are revealed by handle, not
          wallet.
        </p>
      </div>
    </div>
  );
}
