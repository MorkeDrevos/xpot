// components/XpotAccessGate.tsx
'use client';

import { ReactNode, useState } from 'react';
import { SignedIn, SignedOut, useSignIn } from '@clerk/nextjs';
import Image from 'next/image';

type XpotAccessGateProps = {
  children: ReactNode;
};

export default function XpotAccessGate({ children }: XpotAccessGateProps) {
  return (
    <>
      {/* Normal view when authenticated */}
      <SignedIn>{children}</SignedIn>

      {/* When logged out: show dashboard behind + frosted X gate on top */}
      <SignedOut>
        <div className="relative min-h-screen">
          {/* Always render the dashboard under the blur */}
          <div className="pointer-events-none opacity-100">{children}</div>
          <XpotXLoginOverlay />
        </div>
      </SignedOut>
    </>
  );
}

// ─────────────────────────────────────────────
// XPOT X-login overlay (no Apple fade-out)
// ─────────────────────────────────────────────

function XpotXLoginOverlay() {
  const { signIn, isLoaded } = useSignIn();
  const [authInProgress, setAuthInProgress] = useState(false);

  async function handleXLogin() {
    if (!isLoaded || !signIn || authInProgress) return;

  try {
      setAuthInProgress(true); // just switch button to "Connecting…"
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_x', // X / Twitter SSO in Clerk
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
      // No local fade-out – Clerk will now redirect / pop auth window
    } catch (err) {
      console.error('[XPOT] X login failed', err);
      setAuthInProgress(false); // allow retry
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Frosted blur background (static, no auth animation) */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[26px]" />

      {/* Atmosphere glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/18 blur-[140px]" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[160px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#020617]/85 p-6 shadow-[0_60px_200px_rgba(0,0,0,0.95)] backdrop-blur-[22px]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={120}
            height={32}
            priority
          />
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            XPOT identity
          </span>
        </div>

        {/* Top label */}
        <p className="mt-2 text-[11px] tracking-[0.25em] uppercase text-slate-500">
          SIGN IN WITH X TO CONTINUE
        </p>

        {/* Copy */}
        <h1 className="mt-2 text-base font-medium text-slate-100">
          Your X account is your XPOT identity.
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Connect once with X, link your wallet, and access daily XPOT draws.
No passwords. No emails. Just X.
        </p>

        {/* Button */}
        <button
          type="button"
          onClick={handleXLogin}
          disabled={!isLoaded || authInProgress}
          className={`group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_0_40px_rgba(255,255,255,0.16)] transition ${
            authInProgress
              ? 'cursor-wait opacity-90'
              : 'hover:shadow-[0_0_80px_rgba(255,255,255,0.32)]'
          }`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[11px] text-white">
            X
          </span>
          <span>
            {authInProgress ? 'Connecting…' : 'Continue with X / Twitter'}
          </span>
        </button>

        {/* Footer line */}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          XPOT never posts on your behalf. We only read your public profile
          (handle &amp; avatar) and link it to your XPOT identity.
        </p>
      </div>
    </div>
  );
}
