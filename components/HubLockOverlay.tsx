// components/HubLockOverlay.tsx
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useSignIn } from '@clerk/nextjs';

import Modal from '@/components/Modal';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition disabled:cursor-not-allowed disabled:opacity-40';

export default function HubLockOverlay({
  open,
  reason,
  showLinkX = false,
}: {
  open: boolean;
  reason?: string;
  showLinkX?: boolean;
}) {
  const { isLoaded, signIn } = useSignIn();

  async function handleContinueWithX() {
    if (!isLoaded || !signIn) return;

    await signIn.authenticateWithRedirect({
      strategy: 'oauth_x',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/hub',
    });
  }

  const headline = showLinkX ? 'Link X to unlock the Hub' : 'Sign in to unlock the Hub';

  const sub =
    reason ||
    (showLinkX
      ? 'Your account is signed in but X is not linked yet.'
      : 'One verified X identity per draw. No posting required.');

  return (
    <Modal
      open={open}
      onClose={() => {}}
      tone="xpot-light"
      maxWidthClassName="max-w-[440px]"
      hideClose
      closeOnBackdrop={false}
      closeOnEsc={false}
      ariaLabel="XPOT access"
      contentClassName="px-6 pb-6 pt-6 sm:px-7 sm:pb-7 sm:pt-7"
    >
      {/* Small pill */}
      <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400/90 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.36em] text-slate-200">
          XPOT ACCESS
        </span>
      </div>

      <h2 className="mt-5 text-center text-[26px] font-semibold leading-tight text-slate-100">
        {headline}
      </h2>

      <p className="mx-auto mt-2 max-w-[34ch] text-center text-sm text-slate-300">
        {sub}
      </p>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={handleContinueWithX}
          disabled={!isLoaded}
          className={`${BTN_PRIMARY} h-12 px-6 text-sm`}
        >
          {showLinkX ? 'Link X' : 'Continue with X'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>

        <Link href="/" className={`${BTN_UTILITY} h-12 px-6 text-sm`}>
          Back to homepage
        </Link>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
        Tip: to switch X accounts, change it on x.com first then come back here.
      </p>
    </Modal>
  );
}
