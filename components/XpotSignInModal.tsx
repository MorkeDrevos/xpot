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
        {/* Optional close button – currently no-op because parent passes () => {} */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-slate-500 hover:bg-slate-900 hover:text-slate-100"
        >
          Close
        </button>

        {/* Header */}
        <header className="mb-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-400">
            XPOT access
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-50">
            Sign in with X to continue
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            XPOT uses your X identity as your single sign-on. No passwords, no
            emails – just your X account.
          </p>
        </header>

        {/* Clerk sign-in inside our shell */}
        <div className="mt-2">
          <SignIn
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-transparent shadow-none p-0 border-0',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                footer: 'hidden',
                socialButtonsBlockButton:
                  'w-full rounded-full bg-white text-black text-sm font-semibold py-2 hover:bg-slate-100',
                formButtonPrimary:
                  'w-full rounded-full bg-white text-black text-sm font-semibold py-2 hover:bg-slate-100',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
