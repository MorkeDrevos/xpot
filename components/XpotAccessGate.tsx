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
      <SignedIn>{children}</SignedIn>

      <SignedOut>
        <>
          {/* Render dashboard underneath */}
          <div className="pointer-events-none opacity-100">{children}</div>
          <XpotXLoginOverlay />
        </>
      </SignedOut>
    </>
  );
}

// ─────────────────────────────────────────────
// XPOT FROSTED LOGIN OVERLAY (true blur)
// ─────────────────────────────────────────────

function XpotXLoginOverlay() {
  const { signIn, isLoaded } = useSignIn();

  async function handleXLogin() {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_twitter',
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      console.error('[XPOT] X login failed', err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      
      {/* REAL BLUR LAYER */}
      <div className="absolute inset-0 backdrop-blur-[18px] bg-black/55" />

      {/* ATMOSPHERE */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-[140px]" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[160px]" />
      </div>

      {/* CARD */}
      <div className="relative z-50 w-full max-w-md rounded-3xl border border-slate-800/70 bg-[#020617]/85 p-6 shadow-[0_40px_140px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={120}
            height={32}
            priority
          />
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            X identity only
          </span>
        </div>

        {/* Content */}
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Sign in with X to continue
        </p>
        <h1 className="mt-1 text-lg font-semibold">
          Your X handle is your XPOT identity
        </h1>
        <p className="mt-1 text-[13px] text-slate-400">
          No email. No passwords. Just your verified X account.
        </p>

        {/* Why */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">
            Why X login?
          </p>
          <ul className="mt-2 text-[12px] text-slate-300 space-y-1">
            <li>• One identity per X account</li>
            <li>• Winners shown by handle</li>
            <li>• Wallet stays self-custody</li>
          </ul>
        </div>

        {/* Button */}
        <button
          onClick={handleXLogin}
          className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 font-semibold text-black shadow-[0_16px_40px_rgba(15,23,42,0.6)] transition hover:-translate-y-[1px] hover:shadow-[0_24px_60px_rgba(15,23,42,0.9)]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white text-xs">
            X
          </span>
          Continue with X / Twitter
        </button>

        {/* Footer */}
        <p className="mt-3 text-[11px] text-slate-500">
          XPOT never posts on your behalf.  
          We only access your public handle + avatar.
        </p>
      </div>
    </div>
  );
}
