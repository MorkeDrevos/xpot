// app/sign-out/[[...sign-out]]/page.tsx
'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';

export default function SignOutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    // After logout, send them to /hub (or "/" if you prefer)
    signOut({ redirectUrl: '/hub' }).catch(() => {
      // ignore - Clerk will handle fallback
    });
  }, [signOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05060a] text-slate-200">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-5 backdrop-blur-xl">
        <div className="text-sm font-semibold">Signing you out…</div>
        <div className="mt-1 text-xs text-slate-400">Please wait</div>
      </div>
    </div>
  );
}
