'use client';

import { useUser } from '@clerk/nextjs';

export default function XpotAccessGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();

  if (isSignedIn) return <>{children}</>;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/60
        backdrop-blur-[6px]
      "
    >
      <div
        className="
          relative w-[400px] mx-4
          rounded-2xl
          border border-slate-800/60
          bg-black/75
          shadow-[0_35px_120px_rgba(0,0,0,0.9)]
          backdrop-blur-xl
        "
      >
        {/* Glow Edge */}
        <div
          className="
            pointer-events-none absolute inset-[-1px]
            rounded-2xl
            bg-gradient-to-br from-emerald-400/20 via-transparent to-sky-400/20
            opacity-25 blur-lg
          "
        />

        {/* CONTENT */}
        <div className="relative px-6 py-5 text-center space-y-2.5">

          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              className="h-6"
            />
          </div>

          {/* Headline */}
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Sign in with X
          </h1>

          {/* Subline */}
          <p className="text-[11px] text-slate-400 leading-snug">
            Your X handle is your XPOT identity.
            No email. No passwords.
          </p>

          {/* Button */}
          <button
            onClick={() => window.location.href = '/sign-in'}
            className="
              mt-3 w-full rounded-full py-3 text-sm font-semibold
              bg-white text-black hover:brightness-95 active:scale-[0.98]
              transition
            "
          >
            Continue with X / Twitter
          </button>

          {/* Footer */}
          <p className="text-[10px] text-slate-500 leading-tight">
            XPOT never posts on your behalf.
          </p>

        </div>
      </div>
    </div>
  );
}
