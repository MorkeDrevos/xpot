// components/HubLockOverlay.tsx
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useSignIn } from '@clerk/nextjs';

import Modal from '@/components/Modal';

const BTN_PRIMARY =
  'inline-flex w-full items-center justify-center rounded-full bg-sky-500/90 text-black font-semibold shadow-[0_18px_60px_rgba(56,189,248,0.22)] hover:brightness-[1.03] transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition';

function AccessPill() {
  return (
    <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2">
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.10)]" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-200">
        XPOT ACCESS
      </span>
    </div>
  );
}

export default function HubLockOverlay({
  open,
  reason = 'Sign in with X to access the Holder Dashboard.',
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

  return (
    <Modal
      open={open}
      onClose={() => {}}
      tone="xpot-light"
      maxWidthClassName="max-w-[760px]"
      hideClose
      closeOnBackdrop={false}
      closeOnEsc={false}
      containerClassName="rounded-[40px]"
      contentClassName="pt-5"
    >
      <div className="text-center">
        <AccessPill />

        <h2 className="mt-6 text-[40px] font-semibold leading-tight text-slate-100">
          Sign in to enter today’s draw
        </h2>

        <p className="mx-auto mt-4 max-w-[52ch] text-lg leading-relaxed text-slate-300/80">
          One ticket per X account per draw. Your identity is your entry.
          <br />
          No posting required.
        </p>

        <button
          type="button"
          onClick={handleContinueWithX}
          disabled={!isLoaded}
          className={`${BTN_PRIMARY} mt-10 h-16 text-xl`}
        >
          {showLinkX ? 'Link X to continue' : 'Sign in with X'}
          <ArrowRight className="ml-3 h-5 w-5" />
        </button>

        <div className="mt-4">
          <Link href="/" className={`${BTN_UTILITY} h-12 text-sm`}>
            Back to homepage
          </Link>
        </div>

        <p className="mt-5 text-sm text-slate-500">
          Want a different X account? Switch on x.com first then come back here.
        </p>

        {/* optional: keep your “reason” for debugging */}
        {reason ? (
          <p className="mt-3 text-[11px] text-slate-600">{reason}</p>
        ) : null}
      </div>
    </Modal>
  );
}
