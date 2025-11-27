'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

export default function XLoginPage() {
  useEffect(() => {
    // Fire immediately on mount
    void signIn('x', {
      callbackUrl: '/auth/x-complete',
      redirect: true,
    });
  }, []);

  return (
    <main className="flex min-height-screen items-center justify-center bg-black text-slate-300">
      {/* Ultra-minimal, just in case X is slow */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 px-6 py-4 text-center text-sm">
        <p className="font-medium">Connecting to X…</p>
        <p className="mt-1 text-xs text-slate-500">
          If nothing happens, you can close this window and try again.
        </p>
      </div>
    </main>
  );
}
