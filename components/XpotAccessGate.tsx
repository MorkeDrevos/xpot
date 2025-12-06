'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

export default function XpotAccessGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(true);

  if (isSignedIn) return <>{children}</>;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/50 md:bg-black/40
        backdrop-blur-sm md:backdrop-blur-md
      "
    >
      <div
        className="
          relative w-full max-w-md mx-4
          rounded-2xl
          bg-[#020617]/95 md:bg-[#020617]/85
          border border-white/10
          backdrop-blur-md md:backdrop-blur-xl
          shadow-[0_20px_80px_rgba(0,0,0,0.85)]
          md:shadow-[0_30px_120px_rgba(0,0,0,0.85)]
          overflow-hidden
        "
      >
        {/* Glow */}
        <div
          className="
            pointer-events-none absolute inset-[-1px]
            rounded-2xl
            bg-gradient-to-br from-emerald-400/20 via-transparent to-sky-400/20
            blur-lg opacity-40
          "
        />

        {/* Content */}
        <div className="relative p-6 text-center space-y-4">

          <h1 className="text-xl font-semibold">Sign in with X to continue</h1>

          <p className="text-xs text-slate-400">
            Your X handle is your XPOT identity.
            No email. No passwords.
          </p>

          <button
            onClick={() => window.location.href = '/sign-in'}
            className="
              w-full mt-4 rounded-full py-2 text-sm font-semibold
              bg-white text-black hover:bg-slate-100
            "
          >
            Continue with X / Twitter
          </button>

          <p className="text-[10px] text-slate-500">
            XPOT never posts on your behalf.
          </p>

        </div>
      </div>
    </div>
  );
}
