'use client';

import { useState } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

function XpotSignInModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top bar entry point */}
      <SignedOut>
        <button
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-slate-200 hover:text-white transition"
        >
          Sign in
        </button>
      </SignedOut>

      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Modal panel */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed inset-0 z-50 flex items-center justify-center"
            >
              <div className="w-full max-w-sm rounded-2xl bg-[#020617] border border-slate-800 p-6 shadow-2xl">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Sign in to XPOT
                </h2>

                <p className="text-sm text-slate-400 mb-6">
                  Connect your X identity to enter today’s XPOT.
                </p>

                <SignInButton mode="modal">
                  <button className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 transition">
                    Continue with X
                  </button>
                </SignInButton>

                <button
                  onClick={() => setOpen(false)}
                  className="mt-4 w-full text-xs text-slate-500 hover:text-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * ✅ Export BOTH styles to permanently avoid import mismatch errors
 */
export { XpotSignInModal };
export default XpotSignInModal;
