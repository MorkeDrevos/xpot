'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

export default function XLoginPage() {
  useEffect(() => {
    // Immediately kick off X OAuth in this popup
    signIn('x', {
      callbackUrl: '/auth/x-complete',
      redirect: true,
    });
  }, []);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center text-slate-200">
      <div className="rounded-3xl border border-slate-800 bg-slate-950 px-6 py-4 text-sm text-center">
        <p className="font-semibold">Connecting to X…</p>
        <p className="mt-1 text-xs text-slate-500">
          If nothing happens, you can close this window and try again.
        </p>
      </div>
    </main>
  );
}
