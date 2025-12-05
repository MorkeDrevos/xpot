// components/XpotAccessGate.tsx
'use client';

import { ReactNode, useMemo } from 'react';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';

type XpotAccessGateProps = {
  children?: ReactNode;
  className?: string;
};

export default function XpotAccessGate({
  children,
  className,
}: XpotAccessGateProps) {
  const { data: session, status } = useSession();

  const loading = status === 'loading';
  const user = session?.user;

  const handle = useMemo(() => {
    if (!user) return null;
    // prefer explicit handle if you store it, else derive from name/email
    // @ts-ignore – some setups store handle on user
    const storedHandle: string | undefined = user.handle;
    if (storedHandle) return storedHandle.replace('@', '');

    if (user.name) return user.name.replace('@', '');
    if (user.email) return user.email.split('@')[0] || null;
    return null;
  }, [user]);

  const containerClass =
    'rounded-3xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col justify-between' +
    (className ? ` ${className}` : '');

  // Not signed in yet → show X login gate
  if (!user && !loading) {
    return (
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
              XPOT links each wallet to a verified X account so every draw is
              tied to a real identity.
            </p>
          </div>
        </header>

        <div className="mt-4 space-y-3 text-xs text-slate-400">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Why X login?
          </p>
          <ul className="space-y-1">
            <li>• One XPOT identity per X account.</li>
            <li>• Winners revealed by handle, never wallet.</li>
            <li>• Your wallet always remains self-custodied.</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => signIn('twitter')}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
        >
          <span>Continue with X (Twitter)</span>
        </button>

        <p className="mt-3 text-[11px] text-slate-500">
          We never post for you. XPOT only reads your public profile (handle,
          name, avatar) and links it to your XPOT wallet.
        </p>
      </aside>
    );
  }

  // Loading state
  if (loading) {
    return (
      <aside className={containerClass}>
        <p className="text-sm text-slate-300">Checking your X session…</p>
      </aside>
    );
  }

  // Signed in → show profile summary + children (dashboard or homepage content)
  return (
    <section className={containerClass}>
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-800">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? 'X avatar'}
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
              {user?.name || 'XPOT user'}
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
  );
}
