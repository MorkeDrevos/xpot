// components/XpotAccessGate.tsx
'use client';

import { ReactNode, useMemo } from 'react';
import Image from 'next/image';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
  useClerk,
} from '@clerk/nextjs';

type XpotAccessGateProps = {
  children?: ReactNode;
  className?: string;
};

export default function XpotAccessGate({
  children,
  className,
}: XpotAccessGateProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const containerClass =
    'rounded-3xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col justify-between' +
    (className ? ` ${className}` : '');

  // Derive X handle from Clerk user
  const handle = useMemo(() => {
    if (!user) return null;

    // Try external X / Twitter account first
    const accounts = (user as any).externalAccounts as
      | Array<{ provider?: string; username?: string }>
      | undefined;

    const xAccount = accounts?.find(
      (a) =>
        a.provider === 'oauth_x' ||
        a.provider === 'oauth_twitter' ||
        a.provider === 'twitter',
    );

    const fromExternal = xAccount?.username;
    if (fromExternal) return fromExternal.replace('@', '');

    if (user.username) return user.username.replace('@', '');

    const email = user.primaryEmailAddress?.emailAddress;
    if (email) return email.split('@')[0] || null;

    return null;
  }, [user]);

  const displayName =
    user?.fullName || user?.username || handle || 'XPOT user';

  // While Clerk is still loading
  if (!isLoaded) {
    return (
      <aside className={containerClass}>
        <p className="text-sm text-slate-300">
          Checking your XPOT identity…
        </p>
      </aside>
    );
  }

  return (
    <>
      {/* NOT signed in → show X login gate */}
      <SignedOut>
        <aside className={containerClass}>
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
              <Image
                src="/img/xpot-mark.png"
                alt="XPOT"
                width={24}
                height={24}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Sign in with X to continue
              </p>
              <p className="text-xs text-slate-400">
                XPOT links each wallet to a verified X account so every
                draw is tied to a real handle.
              </p>
            </div>
          </header>

          <div className="mt-4 space-y-3 text-xs text-slate-400">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
              Why X login?
            </p>
            <ul className="space-y-1">
              <li>• One XPOT identity per X account.</li>
              <li>• Winners revealed by X handle.</li>
              <li>• Your wallet always remains self-custodied.</li>
            </ul>
          </div>

          <div className="mt-6">
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
              >
                <span>Continue with X (Twitter)</span>
              </button>
            </SignInButton>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            We never post for you. XPOT only reads your public profile
            (handle, name, avatar) and links it to your XPOT wallet.
          </p>
        </aside>
      </SignedOut>

      {/* Signed in → show profile + children */}
      <SignedIn>
        <section className={containerClass}>
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-800">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={displayName}
                    width={40}
                    height={40}
                  />
                ) : (
                  <Image
                    src="/img/xpot-mark.png"
                    alt="XPOT"
                    width={24}
                    height={24}
                  />
                )}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-50">
                  {displayName}
                </p>
                {handle && (
                  <a
                    href={`https://x.com/${handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-emerald-300"
                  >
                    @{handle}
                  </a>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300 hover:border-slate-500 hover:bg-slate-900"
            >
              Sign out
            </button>
          </header>

          {children && <div className="mt-5">{children}</div>}
        </section>
      </SignedIn>
    </>
  );
}
