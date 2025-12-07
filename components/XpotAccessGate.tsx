// components/XpotAccessGate.tsx
'use client';

import { ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import XLoginOverlay from './XLoginOverlay';

type Props = {
  children: ReactNode;
};

export default function XpotAccessGate({ children }: Props) {
  const { isLoaded, user } = useUser();

  // While Clerk is loading, show a simple shell
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-400">Preparing your XPOT dashboard…</p>
      </div>
    );
  }

  // Not signed in → show the X login overlay
  if (!user) {
    return <XLoginOverlay visible={true} />;
  }

  // Signed in → show the real dashboard
  return <>{children}</>;
}
