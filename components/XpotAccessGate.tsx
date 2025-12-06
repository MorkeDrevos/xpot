// components/XpotAccessGate.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { SignedIn, SignedOut, useSignIn } from '@clerk/nextjs';
import Image from 'next/image';

type XpotAccessGateProps = {
  children: ReactNode;
};

export default function XpotAccessGate({ children }: XpotAccessGateProps) {
  return (
    <>
      {/* When authenticated, just show the app */}
      <SignedIn>{children}</SignedIn>

      {/* When logged out, show dashboard behind + frosted X gate */}
      <SignedOut>
        <>
          {/* Dashboard background (no interaction) */}
          <div className="pointer-events-none opacity-100">{children}</div>

          {/* Frosted X overlay */}
          <XpotXLoginOverlay />
        </>
      </SignedOut>
    </>
  );
}

// ─────────────────────────────────────────────
// XPOT frosted login overlay with animations
// ─────────────────────────────────────────────

function XpotXLoginOverlay() {
  const { signIn, isLoaded } = useSignIn();

  const [mounted, setMounted] = useState(false);
  const [authing, setAuthing] = useState(false);

  useEffect(() => {
    // trigger entry animation
    setMounted(true);
  }, []);

  async function handleXLogin() {
    if (!isLoaded || !signIn || authing) return;

    try {
      setAuthing(true);

      await signIn.authenticateWithRedirect({
        strategy: 'oauth_x', // X / Twitter SSO in Clerk
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      console.error('[XPOT] X login failed', err);
      setAuthing(false);
    }
  }

  const easing = 'ease-[cubic-bezier(0.22,0.61,0.36,1)]';
  const overlayVisible = mounted && !authing;

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex items-center justify-center',
        'transition-all duration-500',
        easing,
        overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
    >
      {/* Blur + dim layer (animated) */}
      <div
        className={[
          'absolute inset-0',
          'transition-all duration-700',
          easing,
          overlayVisible
            ? 'backdrop-blur-[26px] bg-black/70'
            : 'backdrop-blur-[4px] bg-black/40',
        ].join(' ')}
      />

      {/* Atmosphere glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/18 blur-[140px]" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[170px]" />
      </div>

      {/* Card */}
      <div
        className={[
          'relative z-50 w-full max-w-md rounded-3xl border border-white/10',
          'bg-[#020617]/80 px-6 pb-6 pt-5',
          'shadow-[0_60px_180px_rgba(0,0,0,0.95)] backdrop-blur-[22px] ring-1 ring-white/5',
          'transition-all duration-500',
          easing,
          overlayVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-3 scale-[0.97]',
        ].join(' ')}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={120}
            height={32}
            priority
          />

          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/5 px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-emerald-300">
            X IDENTITY
          </span>
        </div>

        {/* Copy */}
        <h1 className="text-base font-medium text-slate-100">
          Your X handle is your XPOT identity.
        </h1>
        <p className="mt-1 text-[13px] text-slate-400">
          No email. No passwords. Just your verified X account.
        </p>

        {/* Button + glow pulse */}
        <div className="relative mt-5">
          {/* Glow pulse ring */}
          <div
            aria-hidden="true"
            className={[
              'pointer-events-none absolute inset-0 rounded-full',
              'bg-white/0 shadow-[0_0_48px_rgba(255,255,255,0.28)] blur-xl',
              'opacity-60',
              'animate-pulse',
            ].join(' ')}
          />

          <button
            type="button"
            onClick={handleXLogin}
            disabled={authing || !isLoaded}
            className={[
              'relative group inline-flex w-full items-center justify-center gap-2',
              'rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950',
              'shadow-[0_0_22px_rgba(255,255,255,0.16)]',
              'transition-all duration-500',
              easing,
              'hover:shadow-[0_0_44px_rgba(255,255,255,0.45)] hover:-translate-y-[1px]',
              authing || !isLoaded
                ? 'cursor-wait opacity-80'
                : 'cursor-pointer',
            ].join(' ')}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">
              X
            </span>

            <span>
              {authing ? 'Connecting to X…' : 'Continue with X / Twitter'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
