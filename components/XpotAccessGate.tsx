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
      <SignedOut>
        <XpotXLoginScreen />
      </SignedOut>

      <SignedIn>{children}</SignedIn>
    </>
  );
}

// ─────────────────────────────────────────────
// Ultra-premium XPOT X-login screen
// ─────────────────────────────────────────────

function XpotXLoginScreen() {
  const { signIn, isLoaded } = useSignIn();

  async function handleXLogin() {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_x', // X / Twitter SSO in Clerk
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      console.error('[XPOT] X login failed', err);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-950 to-black text-slate-50">
      {/* Subtle XPOT backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.08)_0,_transparent_55%)]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-950/95 px-6 pb-6 pt-5 shadow-[0_24px_80px_rgba(0,0,0,0.85)] backdrop-blur">
        {/* Logo + tagline */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              width={120}
              height={32}
              priority
            />
          </div>

          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            X identity only
          </span>
        </div>

        {/* Heading */}
        <div className="mb-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Sign in with X to continue
          </p>
          <h1 className="text-lg font-semibold text-slate-50">
            Your X handle is your XPOT identity.
          </h1>
          <p className="text-[13px] text-slate-400">
            Connect once with X, link your wallet, and you&apos;re ready for
            daily XPOT draws. No passwords, no emails, just your verified X
            account.
          </p>
        </div>

        {/* Why X login */}
        <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Why X login?
          </p>
          <ul className="mt-2 space-y-1 text-[12px] text-slate-300">
            <li>• One XPOT identity per X account.</li>
            <li>• Winners revealed by X handle, never by wallet.</li>
            <li>• Your wallet always remains fully self-custodied.</li>
          </ul>
        </div>

        {/* X button */}
        <button
          type="button"
          onClick={handleXLogin}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_40px_rgba(15,23,42,0.65)] transition hover:-translate-y-[1px] hover:bg-white hover:shadow-[0_18px_60px_rgba(15,23,42,0.9)]"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[13px] text-slate-50">
            X
          </span>
          <span>Continue with X / Twitter</span>
        </button>

        {/* Micro-copy */}
        <p className="mt-3 text-[11px] leading-snug text-slate-500">
          XPOT never posts on your behalf. We only read your public profile
          (handle, name, avatar) and link it to your XPOT wallet.
        </p>
      </div>
    </div>
  );
}
