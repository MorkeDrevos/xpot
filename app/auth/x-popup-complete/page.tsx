'use client';

import { useEffect } from 'react';

export default function XPopupCompletePage() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Tell the opener “auth done”
      if (window.opener && window.opener !== window) {
        window.opener.postMessage(
          { type: 'x-auth-complete' },
          window.location.origin
        );
      }
    } catch {
      // ignore cross-origin issues just in case
    }

    // Try to close popup
    window.close();

    // Fallback if close() is blocked – just send user to dashboard
    window.location.href = '/dashboard';
  }, []);

  return null;
}
