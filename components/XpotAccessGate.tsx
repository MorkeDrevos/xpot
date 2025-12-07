// components/XpotAccessGate.tsx
'use client';

import type { ReactNode } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';

type XpotAccessGateProps = {
  children: ReactNode;
};

export default function XpotAccessGate({ children }: XpotAccessGateProps) {
  const { isLoaded, user } = useUser();

  // While Clerk is booting on the client
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-slate-100">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-6 py-4 shadow-2xl">
          <p className="text-sm text-slate-300">
            Connecting your XPOT identity…
          </p>
        </div>
      </div>
    );
  }

  // Not signed in → gate with a simple Clerk sign-in button
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-slate-100">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/90 px-6 py-6 shadow-2xl">
          <h1 className="text-lg font-semibold tracking-tight">
            Sign in to access your XPOT dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            We use your X-powered Clerk identity to link tickets and wallets.
          </p>

          <div className="mt-4">
            <SignInButton mode="modal">
              <button
                type="button"
                className="w-full rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
              >
                Continue with X
              </button>
            </SignInButton>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            By continuing, you agree to XPOT’s terms and understand that we
            only store what we need to connect your X handle and wallet.
          </p>
        </div>
      </div>
    );
  }

  // Signed in → show the real dashboard
  return <>{children}</>;
}
