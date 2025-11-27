'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

export default function XLoginPage() {
  useEffect(() => {
    // Immediately kick off the X OAuth flow
    signIn('x', {
      callbackUrl: '/auth/x-complete',
      redirect: true,
    });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-slate-50">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm text-slate-200">
        <p>Connecting to X…</p>
        <p className="mt-1 text-xs text-slate-500">
          If nothing happens, you can close this window and try again.
        </p>
      </div>
    </main>
  );
}
