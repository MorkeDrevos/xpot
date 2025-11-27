// app/x-login/page.tsx
'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

export default function XLoginPage() {
  useEffect(() => {
    // This will immediately kick off the X OAuth flow in this popup window
    signIn('x', {
      callbackUrl: '/dashboard',
    });
  }, []);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center text-slate-200">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 px-6 py-4 text-sm">
        <p>Connecting to X…</p>
      </div>
    </main>
  );
}
