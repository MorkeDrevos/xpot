'use client';

import { useEffect } from 'react';

export default function XPopupCompletePage() {
  useEffect(() => {
    // If opened as a popup, tell the opener to reload and then close
    if (typeof window !== 'undefined') {
      try {
        if (window.opener) {
          // Reload the dashboard in the main window
          window.opener.location.reload();
          // Close the popup
          window.close();
          return;
        }
      } catch {
        // If cross-origin issues, just fall through to redirect
      }

      // Fallback: if there's no opener (user opened directly), send them to dashboard
      window.location.href = '/dashboard';
    }
  }, []);

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
        Finishing sign-in… If this doesn’t close automatically, you can close this
        window and refresh the dashboard.
      </p>
    </main>
  );
}
