// components/XLoginOverlay.tsx
'use client';

import Image from 'next/image';

type XLoginOverlayProps = {
  visible: boolean;
  onClose?: () => void;
};

export default function XLoginOverlay({ visible, onClose }: XLoginOverlayProps) {
  const { isLoaded, user } = useUser();

  if (!visible) return null;

  const handleClose = () => {
    onClose?.();
  };

  // While Clerk is loading, simple loader card
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 px-6 py-5 shadow-2xl">
          <p className="text-sm text-slate-200">
            Connecting your XPOT identity…
          </p>
        </div>
      </div>
    );
  }

  // Already signed in → close overlay
  if (user) {
    if (onClose) handleClose();
    return null;
  }

  // Not signed in → X login CTA
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 px-6 py-6 shadow-2xl">
        {onClose && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-3 text-slate-500 hover:text-slate-200"
          >
            ✕
          </button>
        )}

        {/* XPOT logo */}
        <div className="mb-4 flex items-center gap-2">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={120}
            height={32}
            priority
          />
        </div>

        <h1 className="text-lg font-semibold tracking-tight text-slate-50">
          Sign in with X to enter XPOT
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          We use your X identity to link wallets, tickets and rewards. Your
          wallet always stays self-custodied.
        </p>

        <div className="mt-4">
          <SignInButton mode="modal">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
            >
              <span>Continue with X</span>
            </button>
          </SignInButton>
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          By continuing, you agree to XPOT’s terms. We only store what we need
          to connect your X handle and wallet.
        </p>
      </div>
    </div>
  );
}
