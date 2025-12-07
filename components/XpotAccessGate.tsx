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
  const [fallbackReady, setFallbackReady] = useState(false);

  // Soft timeout: if Clerk never finishes loading, we still show the dashboard
  useEffect(() => {
    const t = setTimeout(() => setFallbackReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // 1) Normal loading state
  if (!isLoaded && !fallbackReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-slate-50">
        <p className="text-sm text-slate-400">
          Preparing your XPOT dashboard…
        </p>
      </div>
    );
  }

  // 2) Clerk loaded correctly and user is signed in → show real dashboard
  if (isLoaded && user) {
    return <>{children}</>;
  }

  // 3) Clerk loaded, but no user → show X login overlay
  if (isLoaded && !user) {
    return <XLoginOverlay visible={true} />;
  }

  // 4) Clerk never loads (js.clerk.com / DNS issues) → soft-fallback, show dashboard anyway
  if (!isLoaded && fallbackReady) {
    return <>{children}</>;
  }

  return null;
}
