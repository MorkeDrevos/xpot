// app/auth/x-popup-complete/page.tsx
'use client';

import { useEffect } from 'react';

export default function XPopupCompletePage() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // If we were opened as a popup from the dashboard:
      if (window.opener) {
        // Reload XPOT dashboard in the opener
        window.opener.location.reload();
        // Close popup
        window.close();
        return;
      }
    } catch {
      // ignore cross-origin issues, fall back below
    }

    // Fallback: if not opened as popup, just go to dashboard
    window.location.href = '/dashboard';
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif",
      }}
    >
      <p style={{ fontSize: 14, opacity: 0.7 }}>
        Finishing sign-in… If this window doesn’t close automatically, you can close it
        and refresh your XPOT dashboard.
      </p>
    </main>
  );
}
