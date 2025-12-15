// components/XpotSignInModal.tsx
'use client';

import { useState } from 'react';
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';

// Reuse your generic modal shell
import ModalShell from '@/components/Modal';

type XpotSignInModalProps = {
  afterSignOutUrl?: string;
  triggerClassName?: string;
};

export default function XpotSignInModal({
  afterSignOutUrl = '/',
  triggerClassName = 'text-sm font-medium text-slate-200 hover:text-white transition',
}: XpotSignInModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top bar entry point */}
      <SignedOut>
        <button onClick={() => setOpen(true)} className={triggerClassName}>
          Sign in
        </button>
      </SignedOut>

      <SignedIn>
        <UserButton afterSignOutUrl={afterSignOutUrl} />
      </SignedIn>

      {/* Sexy XPOT modal - Clerk is embedded (no Clerk popup modal) */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-black p-6 shadow-[0_0_90px_rgba(124,58,237,0.22)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold text-white">Sign in to XPOT</h2>
            <p className="mt-1 text-sm text-white/60">
              Connect your X identity to enter today’s XPOT.
            </p>
          </div>

          <SignIn
            routing="hash"
            appearance={{
              variables: {
                colorPrimary: '#7c3aed',
                colorBackground: 'transparent',
                colorText: '#e5e7eb',
                borderRadius: '16px',
              },
              elements: {
                card: 'bg-transparent shadow-none p-0',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',

                // social buttons (X)
                socialButtonsBlockButton:
                  'rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white',
                socialButtonsBlockButtonText: 'text-white',

                // hide extra clutter if you want it super clean
                dividerRow: 'hidden',
                form: 'hidden',
                footer: 'hidden',
              },
            }}
          />

          <button
            onClick={() => setOpen(false)}
            className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            Not now
          </button>
        </motion.div>
      </Modal>
    </>
  );
}

/**
 * Export both styles to avoid import mismatch
 */
export { XpotSignInModal };
