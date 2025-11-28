'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function XLoginPage() {
  const { status } = useSession();

  useEffect(() => {
    // Only act once status is resolved
    if (status !== 'unauthenticated' && status !== 'authenticated') return;

    // 1) Not logged in yet → start X OAuth inside the popup
    if (status === 'unauthenticated') {
      void signIn('x', {
        callbackUrl: '/x-login', // popup returns here after OAuth
        redirect: true,
      });
      return;
    }

    // 2) Logged in → notify opener + close popup
    try {
      if (typeof window !== 'undefined' && window.opener) {
        window.opener.postMessage(
          { type: 'x-auth-complete' },
          window.location.origin
        );
      }
    } catch {
      // ignore postMessage errors
    }

    if (typeof window !== 'undefined') {
      window.close();
    }
  }, [status]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-slate-400">
      <p className="text-sm">Connecting your X account…</p>
    </main>
  );
}
