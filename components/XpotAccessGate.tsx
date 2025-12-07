// components/XpotAccessGate.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

type XpotAccessGateProps = {
  children: ReactNode;
};

export default function XpotAccessGate({ children }: XpotAccessGateProps) {
  const { isLoaded, isSignedIn } = useUser();

  // When user is not signed in, kick them to Clerk sign-in
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      const params = new URLSearchParams({
        redirect_url: '/dashboard',
      });

      // Clerk hosted sign-in page (X is configured there)
      window.location.href = `/sign-in?${params.toString()}`;
    }
  }, [isLoaded, isSignedIn]);

  // While Clerk is loading OR redirecting, show a simple shell
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-slate-100">
        <div className="rounded-3xl border border-slate-800 bg-slate-950 px-6 py-5 text-center shadow-2xl">
          <p className="text-sm font-semibold">Redirecting to X login…</p>
          <p className="mt-1 text-xs text-slate-400">
            If nothing happens in a few seconds, refresh the page or go to{' '}
            <span className="font-mono text-slate-200">/sign-in</span>.
          </p>
        </div>
      </div>
    );
  }

  // Signed in → allow access to dashboard
  return <>{children}</>;
}
