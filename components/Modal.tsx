// components/Modal.tsx
'use client';

import { ReactNode, useEffect, useId, useMemo } from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;

  // Optional upgrades
  description?: string;
  size?: ModalSize;
  footer?: ReactNode;
  closeLabel?: string;
  disableBackdropClose?: boolean;
  ariaLabel?: string;
};

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(' ');
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeLabel = 'Close',
  disableBackdropClose = false,
  ariaLabel,
}: ModalProps) {
  const titleId = useId();
  const descId = useId();

  const maxW = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-2xl';
      default:
        return 'max-w-md';
    }
  }, [size]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
    >
      {/* Backdrop (lightweight) */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={() => {
          if (!disableBackdropClose) onClose();
        }}
        className={cx(
          'absolute inset-0 cursor-default',
          'bg-black/70',
          // keep blur very small - big blur is expensive on big screens
          'backdrop-blur-[6px]',
        )}
      />

      {/* XPOT ambient wash (cheap gradients, no JS loops) */}
      <div
        aria-hidden
        className={cx(
          'pointer-events-none absolute inset-0',
          // subtle breathing via CSS only
          'xpot-modal-breathe',
        )}
      />

      {/* Card */}
      <div
        className={cx(
          'relative w-full',
          maxW,
          'rounded-[28px]',
          'border border-white/10',
          // premium glass without going crazy
          'bg-[linear-gradient(180deg,rgba(2,3,19,0.86)_0%,rgba(1,2,10,0.72)_100%)]',
          'shadow-[0_40px_140px_rgba(0,0,0,0.78)]',
          'backdrop-blur-xl',
          'overflow-hidden',
        )}
      >
        {/* Top hairline + glow */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-[20%] h-[320px] w-[320px] rounded-full bg-amber-500/10 blur-3xl"
        />

        {/* Header */}
        {(title || description) && (
          <div className="relative px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {title && (
                  <h2
                    id={titleId}
                    className="truncate text-sm font-semibold text-slate-100"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id={descId}
                    className="mt-1 text-xs leading-relaxed text-slate-400"
                  >
                    {description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className={cx(
                  'shrink-0 rounded-full',
                  'border border-white/10 bg-white/5',
                  'px-3 py-2 text-xs font-semibold text-slate-200',
                  'hover:bg-white/10',
                )}
              >
                {closeLabel}
              </button>
            </div>

            <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        )}

        {/* Body */}
        <div className="relative px-5 py-5 sm:px-6 sm:py-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="mt-4">{footer}</div>
          </div>
        )}
      </div>

      {/* Local CSS (scoped) */}
      <style jsx>{`
        .xpot-modal-breathe {
          background:
            radial-gradient(
              900px 520px at 50% 35%,
              rgba(99, 102, 241, 0.18),
              transparent 60%
            ),
            radial-gradient(
              760px 460px at 30% 80%,
              rgba(236, 72, 153, 0.10),
              transparent 62%
            ),
            radial-gradient(
              680px 420px at 72% 82%,
              rgba(245, 158, 11, 0.10),
              transparent 60%
            );
          opacity: 0.85;
          animation: xpotBreathe 6.5s ease-in-out infinite;
        }

        @keyframes xpotBreathe {
          0% {
            transform: scale(1);
            opacity: 0.78;
          }
          50% {
            transform: scale(1.03);
            opacity: 0.92;
          }
          100% {
            transform: scale(1);
            opacity: 0.78;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .xpot-modal-breathe {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
