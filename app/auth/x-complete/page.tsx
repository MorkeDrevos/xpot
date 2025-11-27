'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function XCompletePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.opener) {
      try {
        window.opener.location.href = '/dashboard';
      } catch {}

      window.close();
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-slate-100">
      <p className="text-sm text-slate-400">Finishing sign in…</p>
    </main>
  );
}
