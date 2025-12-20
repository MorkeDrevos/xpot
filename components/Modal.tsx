// components/Modal.tsx
'use client';

import { ReactNode, useEffect, useMemo } from 'react';

type ModalTone = 'dark' | 'xpot-light' | 'glass';

type ModalProps = {
  open: boolean;
  onClose: () => void;

  title?: string;
  subtitle?: string;

  children: ReactNode;

  // ✅ NEW (fixes your build error + lets us do XPOT light)
  tone?: ModalTone;
  maxWidthClassName?: string;

  // Behavior
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;

  // Layout
  hideCloseButton?: boolean;
  headerRightSlot?: ReactNode;
  footerSlot?: ReactNode;
  contentClassName?: string;
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  tone = 'dark',
  maxWidthClassName = 'max-w-md',
  closeOnEsc = true,
  closeOnBackdrop = true,
  hideCloseButton = false,
  headerRightSlot,
  footerSlot,
  contentClassName = '',
}: ModalProps) {
  useEffect(() => {
    if (!open || !closeOnEsc) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, closeOnEsc, onClose]);

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
            'bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.25))]',
            'shadow-[0_40px_140px_rgba(0,0,0,0.78)]',
          ].join(' '),
        title: 'text-slate-50',
        subtitle: 'text-slate-300',
        close:
          'text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 bg-white/5',
        topGlow:
          'bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.16),transparent_56%)]',
        bottomGlow:
          'bg-[radial-gradient(circle_at_30%_100%,rgba(245,158,11,0.14),transparent_60%)]',
      };
    }

    if (tone === 'glass') {
      return {
        backdrop: 'bg-black/60 backdrop-blur-xl',
        shell:
          'border border-white/10 bg-white/[0.04] shadow-[0_30px_120px_rgba(0,0,0,0.70)]',
        title: 'text-slate-100',
        subtitle: 'text-slate-300',
        close:
          'text-slate-200 hover:text-white hover:bg-white/10 border border-white/10 bg-white/5',
        topGlow: 'bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.10),transparent_60%)]',
        bottomGlow: 'bg-[radial-gradient(circle_at_40%_100%,rgba(255,255,255,0.06),transparent_64%)]',
      };
    }

    // dark (default)
    return {
      backdrop: 'bg-black/60 backdrop-blur-sm',
      shell: 'border border-slate-800 bg-slate-950 shadow-xl',
      title: 'text-slate-100',
      subtitle: 'text-slate-400',
      close: 'text-slate-400 hover:text-slate-100 hover:bg-slate-800',
      topGlow: '',
      bottomGlow: '',
    };
  }, [tone]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        className={`absolute inset-0 w-full ${styles.backdrop}`}
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Card */}
      <div
        className={[
          'relative w-full overflow-hidden rounded-[28px] backdrop-blur-xl',
          maxWidthClassName,
          styles.shell,
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        {/* XPOT subtle ambient (only meaningful on xpot-light / glass) */}
        {tone !== 'dark' && (
          <>
            <div aria-hidden className={`pointer-events-none absolute inset-0 ${styles.topGlow}`} />
            <div aria-hidden className={`pointer-events-none absolute inset-0 ${styles.bottomGlow}`} />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </>
        )}

        {/* Header */}
        {(title || !hideCloseButton || headerRightSlot) && (
          <div className="relative flex items-start justify-between gap-3 px-5 pb-3 pt-5">
            <div className="min-w-0">
              {title && (
                <h2 className={`truncate text-base font-semibold ${styles.title}`}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className={`mt-1 text-sm ${styles.subtitle}`}>
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {headerRightSlot}
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${styles.close}`}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={['relative px-5 pb-5', contentClassName].join(' ')}>
          {children}
        </div>

        {/* Footer */}
        {footerSlot && (
          <div className="relative border-t border-white/10 px-5 py-4">
            {footerSlot}
          </div>
        )}
      </div>
    </div>
  );
}
