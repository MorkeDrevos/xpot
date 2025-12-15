// components/XpotSignInModal.tsx
'use client';

import { useState } from 'react';
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

import ModalShell from '@/components/Modal';

type XpotSignInModalProps = {
  afterSignOutUrl?: string;
  triggerClassName?: string;
};

function XpotSignInModal({
  afterSignOutUrl = '/',
  triggerClassName = 'text-sm font-medium text-slate-200 hover:text-white transition',
}: XpotSignInModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SignedOut>
        <button onClick={() => setOpen(true)} className={triggerClassName}>
          Sign in
        </button>
      </SignedOut>

      <SignedIn>
        <UserButton afterSignOutUrl={afterSignOutUrl} />
      </SignedIn>

      <AnimatePresence>
        {open && (
          <ModalShell open={open} onClose={() => setOpen(false)} title="Sign in to XPOT">
            <motion.div
              key="xpot-signin"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="px-1 pb-1"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-4 text-sm text-slate-400">
                Connect your X identity to enter today’s XPOT.
              </p>

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
                    socialButtonsBlockButton:
                      'rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white',
                    socialButtonsBlockButtonText: 'text-white',
                    dividerRow: 'hidden',
                    form: 'hidden',
                    footer: 'hidden',
                  },
                }}
              />

              <button
                onClick={() => setOpen(false)}
                className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
              >
                Not now
              </button>
            </motion.div>
          </ModalShell>
        )}
      </AnimatePresence>
    </>
  );
}

export { XpotSignInModal };
export default XpotSignInModal;
