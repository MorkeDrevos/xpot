'use client';

import { useState } from 'react';
import { SignInButton, SignedOut, UserButton, SignedIn } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// XPOT Custom Sign-In Modal
// ─────────────────────────────────────────────

export function XpotSignInModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top bar entry point */}
      <SignedOut>
        <button
          onClick={() => setOpen(true)}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition shadow-xl xpot-cta-pulse"
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
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="modal"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="xpot-modal-enter bg-[#020617]/90 border border-slate-700 rounded-2xl p-6 shadow-2xl w-full max-w-sm"
            >
              <h2 className="text-xl font-semibold mb-3">Welcome to XPOT</h2>
              <p className="text-slate-300 text-sm mb-6">
                Sign in with your X (Twitter) account to join draws, claim rewards
                and track your XPOT activity.
              </p>

              <SignInButton mode="modal">
                <button className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition font-medium shadow-lg">
                  Continue with X (Twitter)
                </button>
              </SignInButton>

              <button
                onClick={() => setOpen(false)}
                className="w-full py-2 mt-3 rounded-lg bg-slate-800/60 hover:bg-slate-700 transition text-slate-300 text-sm"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
