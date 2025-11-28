'use client';

import { useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function XStartPage() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get('callbackUrl') || '/dashboard';

    // Kick off X login directly
    window.location.href = `/api/auth/signin/x?callbackUrl=${encodeURIComponent(
      callbackUrl
    )}`;
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      }}
    >
      <p style={{ fontSize: 14, opacity: 0.7 }}>
        Opening X sign-in…
      </p>
    </main>
  );
}
