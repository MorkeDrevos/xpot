// components/XpotSignInModal.tsx
'use client';

import { SignIn } from '@clerk/nextjs';

type XpotSignInModalProps = {
  open: boolean;
  onClose: () => void;
};

export function XpotSignInModal({ open, onClose }: XpotSignInModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl">
        {/* Your own header */}
        <header className="mb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">
            XPOT access
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-50">
            Sign in with X to continue
          </h1>
        </header>

        {/* Clerk sign-in form inside your shell */}
        <SignIn
          appearance={{
            elements: {
              card: 'shadow-none border-0 bg-transparent p-0',
            },
          }}
          // Optional: only show X provider, no email/password
          routing="hash"
        />

        {/* Close button, etc */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-xs text-slate-400 hover:text-slate-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
