// components/Modal.tsx
'use client';

import { ReactNode, useEffect, useMemo } from 'react';

export type ModalTone = 'dark' | 'xpot-light';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;

  // Header
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
  hideClose?: boolean;
  headerRightSlot?: ReactNode;

  // Layout
  tone?: ModalTone;
  maxWidthClassName?: string;
  containerClassName?: string; // outer card container
  contentClassName?: string; // inner padding wrapper
  footerSlot?: ReactNode;

  // Behavior
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showBackdrop?: boolean;

  // A11y
  ariaLabel?: string;

  // Layering
  zIndexClassName?: string; // e.g. "z-[90]"
};

export default function Modal({
  open,
  onClose,
  children,

  title,
  subtitle,
  hideHeader = false,
  hideClose = false,
  headerRightSlot,

  tone = 'dark',
  maxWidthClassName = 'max-w-md',
  containerClassName = '',
  contentClassName = 'p-5 sm:p-6',
  footerSlot,

  closeOnBackdrop = true,
  closeOnEsc = true,
  showBackdrop = true,

  ariaLabel,
  zIndexClassName = 'z-[90]',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    if (!closeOnEsc) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, closeOnEsc, onClose]);

  // prevent body scroll when open (cheap + nice)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const styles = useMemo(() => {
    if (tone === 'xpot-light') {
      return {
        backdrop: 'bg-black/70 backdrop-blur-2xl',
        shell:
          [
            'border border-white/10',
            'bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.10),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.10),transparent_50%),linear-gradient(to_bottom,rgba(2,6,23,0.78),rgba(2,6,23,0.62))]',
            'shadow-[0_40px_140px_rgba(0,0,0,0.82)]',
            'backdrop-blur-xl',
          ].join(' '),
        topLine:
          'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent',
        glowA:
          'pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl',
        glowB:
          'pointer-events-none absolute -bottom-28 left-[18%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/10 blur-3xl',
        title: 'text-slate-100',
        subtitle: 'text-slate-300',
        closeBtn:
          'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
      };
    }

    // default dark (your original vibe, just slightly nicer)
    return {
      backdrop: 'bg-black/60 backdrop-blur-sm',
      shell:
        'border border-slate-800 bg-slate-950 shadow-[0_22px_80px_rgba(0,0,0,0.70)]',
      topLine: '',
      glowA: '',
      glowB: '',
      title: 'text-slate-100',
      subtitle: 'text-slate-300',
      closeBtn: 'hover:bg-slate-800 text-slate-300 hover:text-slate-100',
    };
  }, [tone]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center px-4`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title || 'Dialog'}
    >
      {showBackdrop && (
        <button
          type="button"
          aria-label="Close modal"
          className={`absolute inset-0 ${styles.backdrop}`}
          onClick={closeOnBackdrop ? onClose : undefined}
        />
      )}

      <div
        className={[
          'relative w-full',
          maxWidthClassName,
          'rounded-[28px] sm:rounded-[32px]',
          'overflow-hidden',
          styles.shell,
          containerClassName,
        ].join(' ')}
      >
        {styles.topLine ? <div aria-hidden className={styles.topLine} /> : null}
        {styles.glowA ? <div aria-hidden className={styles.glowA} /> : null}
        {styles.glowB ? <div aria-hidden className={styles.glowB} /> : null}

        {/* Header */}
        {!hideHeader && (title || subtitle || !hideClose || headerRightSlot) ? (
          <div className="relative flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="min-w-0">
              {title ? (
                <h2 className={`text-sm font-semibold ${styles.title}`}>
                  {title}
                </h2>
              ) : null}
              {subtitle ? (
                <p className={`mt-1 text-xs ${styles.subtitle}`}>{subtitle}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {headerRightSlot}
              {!hideClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className={[
                    'rounded-full px-3 py-2 text-xs font-semibold transition',
                    styles.closeBtn,
                  ].join(' ')}
                >
                  Close
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Content */}
        <div className={`relative ${contentClassName}`}>{children}</div>

        {/* Footer */}
        {footerSlot ? (
          <div className="relative border-t border-white/10 px-5 py-4 sm:px-6">
            {footerSlot}
          </div>
        ) : null}
      </div>
    </div>
  );
}
