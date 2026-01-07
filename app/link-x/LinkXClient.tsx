// app/link-x/LinkXClient.tsx
'use client';

import { useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { usePathname, useSearchParams } from 'next/navigation';

export default function LinkXClient({ redirectUrl }: { redirectUrl: string }) {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoaded) return;

    const currentUrl =
      typeof window !== 'undefined'
        ? window.location.href
        : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

    // If not signed in, go to sign-in and come back here
    if (!user) {
      clerk.redirectToSignIn({ redirectUrl: currentUrl });
      return;
    }

    // Check if X/Twitter is already linked
    const hasX = (user.externalAccounts || []).some(acc => {
      const p = String((acc as any)?.provider ?? '').toLowerCase();
      return p.includes('twitter') || p === 'oauth_x' || p === 'x';
    });

    if (hasX) {
      window.location.href = redirectUrl;
      return;
    }

    // Otherwise open Clerk profile focused on connecting accounts
    clerk.openUserProfile();
  }, [isLoaded, user, clerk, redirectUrl, pathname, searchParams]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 text-center backdrop-blur-xl">
        <div className="text-sm font-semibold text-slate-100">Link X</div>
        <div className="mt-1 text-xs text-slate-400">Opening account linking...</div>
      </div>
    </div>
  );
}
