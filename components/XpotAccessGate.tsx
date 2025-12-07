// components/XpotAccessGate.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useUser, redirectToSignIn } from '@clerk/nextjs';

type XpotAccessGateProps = {
  children: ReactNode;
};

export default function XpotAccessGate({ children }: XpotAccessGateProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [gaveUp, setGaveUp] = useState(false);

  // Main redirect to Clerk sign-in (X is configured there)
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      redirectToSignIn({
        redirectUrl: '/dashboard',
      });
    }
  }, [isLoaded, isSignedIn]);

  // Failsafe: if Clerk never finishes loading for some reason,
  // after a few seconds we at least show a clearer message.
  useEffect(() => {
    if (isLoaded) return;

    const timer = setTimeout(() => {
      if (!isLoaded) {
        setGaveUp(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [isLoaded]);

  // While Clerk is loading OR redirecting, show a simple shell
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-slate-100">
        <div className="rounded-3xl border border-slate-800 bg-slate-950 px-6 py-5 text-center shadow-2xl">
          {!gaveUp ? (
            <>
              <p className="text-sm font-semibold">Redirecting to X login…</p>
              <p className="mt-1 text-xs text-slate-400">
                If nothing happens in a few seconds, refresh the page or go to{' '}
                <span className="font-mono text-slate-200">/sign-in</span>.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">Login is taking longer than expected.</p>
              <p className="mt-1 text-xs text-slate-400">
                Try refreshing the page, or open{' '}
                <span className="font-mono text-slate-200">/sign-in</span> directly in a new tab.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Signed in → allow access to dashboard
  return <>{children}</>;
}
