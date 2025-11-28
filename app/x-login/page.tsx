'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function XLoginPage() {
  const { status } = useSession();

  useEffect(() => {
    // Wait until we actually know the status
    if (status !== 'unauthenticated' && status !== 'authenticated') return;

    // 1) Not logged in yet → start X OAuth inside the popup
    if (status === 'unauthenticated') {
      void signIn('x', {
        callbackUrl: '/x-login', // popup comes back here after OAuth
        redirect: true,
      });
      return;
    }

    // 2) Logged in → notify opener + close popup
    try {
      if (window.opener) {
        window.opener.postMessage(
          { type: 'x-auth-complete' },
          window.location.origin
        );
      }
    } catch {
      // ignore postMessage errors
    }

    window.close();
  }, [status]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-slate-400">
      <p className="text-sm">Connecting your X account…</p>
    </main>
  );
}
