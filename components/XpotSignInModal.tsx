// components/XpotSignInModal.tsx
'use client';

type XpotSignInModalProps = {
  open: boolean;
  onClose: () => void;
};

export function XpotSignInModal({ open, onClose }: XpotSignInModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl">
        <header className="mb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">
            XPOT access
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-50">
            X login coming soon
          </h1>
        </header>

        <p className="text-xs text-slate-400">
          We’re wiring up a new X login flow. For now this dialog is just a
          placeholder and does not perform any sign-in.
        </p>

        <button
          onClick={onClose}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-200 hover:border-slate-500 hover:bg-slate-900"
        >
          Close
        </button>
      </div>
    </div>
  );
}
