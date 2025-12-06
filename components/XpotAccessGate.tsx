// components/XpotAccessGate.tsx
'use client';

import { ReactNode } from 'react';
import { SignedIn, SignedOut, useSignIn } from '@clerk/nextjs';
import Image from 'next/image';

type XpotAccessGateProps = {
  children: ReactNode;
};

export default function XpotAccessGate({ children }: XpotAccessGateProps) {
  return (
    <>
      {/* Normal view when logged in */}
      <SignedIn>{children}</SignedIn>

      {/* When logged out: show dashboard blurred + overlay gate */}
      <SignedOut>
        <div className="relative min-h-screen">
          {/* Background dashboard (non-interactive) */}
          <div className="pointer-events-none opacity-100">{children}</div>

          {/* Frosted X login overlay */}
          <XpotXLoginOverlay />
        </div>
      </SignedOut>
    </>
  );
}

// ─────────────────────────────────────────────
// XPOT frosted X login overlay
// ─────────────────────────────────────────────

function XpotXLoginOverlay() {
  const { signIn, isLoaded } = useSignIn();

  async function handleXLogin() {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_twitter',          // X / Twitter via Clerk
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      console.error('[XPOT] X login failed', err);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Blur + dim layer */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[26px]" />

      {/* Atmosphere glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/18 blur-[140px]" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-[420px] w-[420px] rounded-full bg-cyan-500/14 blur-[160px]" />
      </div>

      {/* Card */}
      <div className="relative z-[70] w-full max-w-md rounded-3xl border border-white/10 bg-[#020617]/80 p-6 shadow-[0_60px_180px_rgba(0,0,0,0.95)] backdrop-blur-[22px]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={120}
            height={32}
            priority
          />
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-emerald-300 uppercase">
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

        {/* X button */}
        <button
          type="button"
          onClick={handleXLogin}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(255,255,255,0.15)] transition hover:shadow-[0_0_70px_rgba(255,255,255,0.32)]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[13px] text-white">
            X
          </span>
          <span>Continue with X / Twitter</span>
        </button>

        {/* Footer */}
        <p className="mt-3 text-[11px] text-slate-500">
          One XPOT identity per X account. Winners are revealed by handle,
          not wallet.
        </p>
      </div>
    </div>
  );
}
