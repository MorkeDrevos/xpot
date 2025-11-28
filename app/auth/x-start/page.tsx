// app/auth/x-start/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function XStartPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const cb = searchParams.get('callbackUrl') || '/dashboard';

    // Immediately start the NextAuth sign-in flow for provider "x"
    // This will redirect straight to X without showing the NextAuth button page.
    signIn('x', {
      callbackUrl: cb,
      redirect: true,
    });
  }, [searchParams]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif",
      }}
    >
      <p style={{ fontSize: 14, opacity: 0.7 }}>
        Opening X sign-in…
      </p>
    </main>
  );
}
