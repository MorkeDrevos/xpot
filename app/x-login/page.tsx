'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function XLoginPage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Kick off Twitter / X OAuth inside the popup
      signIn('twitter', {
        callbackUrl: '/x-login', // popup will land back here after OAuth
        redirect: true,
      });
    }

    if (status === 'authenticated') {
      // Tell the opener we're done and close the popup
      try {
        if (window.opener) {
          window.opener.postMessage({ type: 'xpot-auth-success' }, window.location.origin);
        }
      } catch {
        // ignore postMessage errors
      }
      window.close();
    }
  }, [status]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-slate-50">
      <p className="text-sm text-slate-300">Connecting your X account…</p>
    </main>
  );
}
