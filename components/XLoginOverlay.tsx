// components/XLoginOverlay.tsx
'use client';

import Image from 'next/image';

type XLoginOverlayProps = {
  visible: boolean;
  onClose: () => void;
};

export default function XLoginOverlay({ visible, onClose }: XLoginOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950/95 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 text-sm"
        >
          ✕
        </button>

        <div className="mb-4 flex items-center gap-2">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={120}
            height={32}
            priority
          />
        </div>

        <h1 className="text-lg font-semibold text-slate-50">
          X login coming soon
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          For now you can explore the XPOT dashboard without signing in. X
          login will be enabled in a later update.
        </p>
      </div>
    </div>
  );
}
