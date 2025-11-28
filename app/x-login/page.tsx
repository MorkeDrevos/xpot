'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function XLoginPage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('twitter', {
        callbackUrl: '/x-login',
        redirect: true,
      });
    }

    if (status === 'authenticated') {
      try {
        if (window.opener) {
          window.opener.postMessage(
            { type: 'x-auth-complete' },
            window.location.origin
          );
        }
      } catch {
        // ignore
      }

      window.close();
    }
  }, [status]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-slate-400">
      <p className="text-sm">Connecting your X account…</p>
    </main>
  );
}
