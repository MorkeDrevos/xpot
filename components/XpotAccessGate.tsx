// components/XpotAccessGate.tsx
'use client';

import { useMemo } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import clsx from 'clsx';

type XpotAccessGateProps = {
  className?: string;
};

export default function XpotAccessGate({
  className,
}: XpotAccessGateProps) {
  const { data: session, status } = useSession();

  const handle = (session?.user as any)?.handle as string | undefined;
  const avatar = session?.user?.image ?? (session?.user as any)?.xAvatarUrl;
  const displayName =
    handle || session?.user?.name || 'XPOT holder';

  const isAuthed = status === 'authenticated';

  // One place to define where user lands after login
  const callbackUrl = useMemo(
    () => (typeof window !== 'undefined' ? window.location.href : '/'),
    [],
  );

  return (
    <section
      className={clsx(
        'relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 px-6 py-7 shadow-xl',
        'before:pointer-events-none before:absolute before:inset-x-0 before:-top-32 before:h-56 before:bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.22),_transparent_65%)]',
        className,
      )}
    >
      {/* Header pill */}
      <div className="relative mb-6 flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.45)]" />
          Xpot access
        </span>

        {isAuthed && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-[11px] font-medium text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline"
          >
            Switch account
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Left copy */}
        <div className="max-w-md space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            {isAuthed
              ? 'You’re ready for today’s draw'
              : 'Sign in to enter today’s draw'}
          </h2>

          {!isAuthed && (
            <p className="text-sm text-slate-400">
              One ticket per X account per draw. Your X identity is your
              entry. No posting required.
            </p>
          )}

          {isAuthed && (
            <p className="text-sm text-slate-400">
              Your current X identity is linked to this XPOT session.
              When today’s window opens, you’ll be able to grab your
              ticket instantly.
            </p>
          )}

          {/* CTA */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!isAuthed ? (
              <button
                type="button"
                onClick={() => signIn('twitter', { callbackUrl })}
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-7 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400"
              >
                Sign in with X
              </button>
            ) : (
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="font-medium">Access granted</span>
              </div>
            )}

            {!isAuthed && (
              <p className="text-[11px] text-slate-500">
                Want a different X account? Switch on x.com first, then
                come back here.
              </p>
            )}
          </div>
        </div>

        {/* Right: identity preview */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-black/40 px-4 py-3 text-sm text-slate-200">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-700 bg-slate-900">
            {avatar ? (
              <Image
                src={avatar}
                alt="X avatar"
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                X
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
              {isAuthed ? 'Signed in as' : 'You will sign in as'}
            </span>
            <span className="font-medium text-slate-50">
              {handle ?? (
                <span className="text-slate-500">
                  Connect your X account
                </span>
              )}
            </span>
            {isAuthed && handle && (
              <span className="text-[11px] text-slate-500">
                X identity linked to today’s XPOT session
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
