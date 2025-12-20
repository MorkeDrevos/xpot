// components/Modal.tsx
'use client';

import { ReactNode, useEffect, useMemo } from 'react';

export type ModalTone = 'dark' | 'xpot-light';

export type ModalProps = {
  open: boolean;
  onClose: () => void;

  // Backwards compatible
  title?: string;

  // New
  subtitle?: string;
  tone?: ModalTone;

  ariaLabel?: string;

  maxWidthClassName?: string; // e.g. "max-w-3xl"
  containerClassName?: string; // outer shell (rounded, border, bg)
  contentClassName?: string; // inner content padding etc.

  hideHeader?: boolean;
  hideClose?: boolean;

  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;

  headerRightSlot?: ReactNode;
  footerSlot?: ReactNode;

  children: ReactNode;
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  tone = 'dark',
  ariaLabel,

  maxWidthClassName = 'max-w-md',
  containerClassName,
  contentClassName,

  hideHeader = false,
  hideClose = false,

  closeOnEsc = true,
  closeOnBackdrop = true,

  headerRightSlot,
  footerSlot,

  children,
}: ModalProps) {
  // ESC
  useEffect(() => {
    if (!open) return;
    if (!closeOnEsc) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, closeOnEsc, onClose]);

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const styles = useMemo(() => {
    const isLight = tone === 'xpot-light';

    const backdrop = isLight
      ? 'bg-black/70 backdrop-blur-2xl'
      : 'bg-black/60 backdrop-blur-sm';

    const shellBase =
      'relative w-full overflow-hidden rounded-[28px] border shadow-[0_30px_120px_rgba(0,0,0,0.75)]';

    const shell = isLight
      ? [
          'border-white/10',
          'bg-[radial-gradient(circle_at_50%_-20%,rgba(56,189,248,0.12),transparent_60%),linear-gradient(to_bottom,rgba(2,6,23,0.78),rgba(2,6,23,0.50))]',
          'backdrop-blur-xl',
        ].join(' ')
      : 'border-slate-800 bg-slate-950';

    const topHairline = isLight
      ? 'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent'
      : '';

    const ambient = isLight ? (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-[18%] h-[380px] w-[380px] rounded-full bg-amber-500/10 blur-3xl"
        />
      </>
    ) : null;

    const headerTitle = isLight
      ? 'text-slate-100'
      : 'text-slate-100';

    const headerSubtitle = isLight
      ? 'text-slate-300'
      : 'text-slate-400';

    const closeBtn = isLight
      ? 'rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10'
      : 'rounded-full px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100';

    return {
      backdrop,
      shellBase,
      shell,
      topHairline,
      ambient,
      headerTitle,
      headerSubtitle,
      closeBtn,
    };
  }, [tone]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${styles.backdrop}`}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title || 'Modal'}
        className={`relative w-full ${maxWidthClassName}`}
      >
        <div className={`${styles.shellBase} ${styles.shell} ${containerClassName || ''}`}>
          {/* XPOT subtle top line */}
          {styles.topHairline ? <div aria-hidden className={styles.topHairline} /> : null}

          {/* Ambient glows (XPOT light) */}
          {styles.ambient}

          {/* Header */}
          {!hideHeader && (
            <div className="relative flex items-start justify-between gap-3 px-5 pt-5">
              <div className="min-w-0">
                {title ? (
                  <h2 className={`truncate text-sm font-semibold ${styles.headerTitle}`}>
                    {title}
                  </h2>
                ) : null}

                {subtitle ? (
                  <p className={`mt-1 text-xs ${styles.headerSubtitle}`}>
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {headerRightSlot}
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={styles.closeBtn}
                    aria-label="Close"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className={`relative px-5 pb-5 ${!hideHeader ? 'pt-4' : 'pt-5'} ${contentClassName || ''}`}>
            {children}
          </div>

          {/* Footer slot */}
          {footerSlot ? (
            <div className="relative border-t border-white/10 px-5 py-4">
              {footerSlot}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
