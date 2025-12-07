// components/XpotAccessGate.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import XLoginOverlay from './XLoginOverlay';

type Props = {
  children: ReactNode;
};

export default function XpotAccessGate({ children }: Props) {
  const { isLoaded, user } = useUser();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Hard fallback after 2s
  useEffect(() => {
    const t = setTimeout(() => setTimeoutReached(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Loader for up to 2s while Clerk bootstraps
  if (!isLoaded && !timeoutReached) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-sm text-slate-400">Loading your XPOT session...</p>
      </div>
    );
  }

  // Clerk active + signed in
  if (isLoaded && user) {
    return <>{children}</>;
  }

  // Clerk active + NOT signed in → show X login
  if (isLoaded && !user) {
    return <XLoginOverlay visible={true} />;
  }

  // Clerk never loaded (network / DNS) + timeout → just show app
  if (!isLoaded && timeoutReached) {
    return <>{children}</>;
  }

  return null;
}
