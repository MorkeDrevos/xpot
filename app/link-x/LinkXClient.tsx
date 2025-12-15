// app/link-x/LinkXClient.tsx
'use client';

import { useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

export default function LinkXClient({ redirectUrl }: { redirectUrl: string }) {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const hasX =
      (user.externalAccounts || []).some(acc => {
        const p = String((acc as any)?.provider ?? '').toLowerCase();
        return p.includes('twitter') || p === 'oauth_x' || p === 'oauth_twitter' || p === 'twitter';
      });

    if (hasX) {
      window.location.href = redirectUrl;
      return;
    }

    // Push them straight into Clerk's "connect external account" UI.
    // This opens the account portal focused on connections.
    clerk.openUserProfile();
  }, [isLoaded, user, clerk, redirectUrl]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 text-center backdrop-blur-xl">
        <div className="text-sm font-semibold text-slate-100">Link X to continue</div>
        <div className="mt-1 text-xs text-slate-400">
          Opening account linking…
        </div>
      </div>
    </div>
  );
}
