// components/Modal.tsx
'use client';

import { ReactNode, useEffect, useMemo } from 'react';

export type ModalTone = 'dark' | 'xpot-light';

export type ModalProps = {
  open: boolean;
  onClose: () => void;

  title?: string;
  subtitle?: string;

  children: ReactNode;

  // Visual + layout
  tone?: ModalTone;
  maxWidthClassName?: string;
  containerClassName?: string;
  contentClassName?: string;

  // Header/Footer slots
  headerRightSlot?: ReactNode;
  footerSlot?: ReactNode;

  // Behavior
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  hideClose?: boolean;
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  tone = 'dark',
  maxWidthClassName = 'max-w-md',
  containerClassName = '',
  contentClassName = '',
  headerRightSlot,
  footerSlot,
  closeOnEsc = true,
  closeOnBackdrop = true,
  hideClose = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    // lock scroll (simple + reliable)
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (!closeOnEsc) return;
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, closeOnEsc]);

  const styles = useMemo(() => {
    if (tone === 'xpot-light') {
      return {
        backdrop: 'bg-black/65 backdrop-blur-2xl',
        shell: [
          'border border-white/10',
          'bg-[radial-gradient(circle_at_18%_8%,rgba(56,189,248,0.10),transparent_52%),radial-gradient(circle_at_82%_0%,rgba(99,102,241,0.12),transparent_56%),linear-gradient(to_bottom,rgba(15,23,42,0.62),rgba(2,6,23,0.82))]',
          'shadow-[0_40px_140px_rgba(0,0,0,0.80)]',
          'backdrop-blur-xl',
          'rounded-[34px]',
        ].join(' '),
        title: 'text-slate-100',
        subtitle: 'text-slate-300',
        closeBtn:
          'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
      } as const;
    }

    return {
      backdrop: 'bg-black/60 backdrop-blur-sm',
      shell:
        'rounded-2xl border border-slate-800 bg-slate-950 shadow-xl backdrop-blur-xl',
      title: 'text-slate-100',
      subtitle: 'text-slate-400',
      closeBtn:
        'hover:bg-slate-800 text-slate-400 hover:text-slate-100',
    } as const;
  }, [tone]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[90] flex items-center justify-center px-4 ${styles.backdrop}`}>
      {/* backdrop click catcher */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={closeOnBackdrop ? onClose : undefined}
        className="absolute inset-0 cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        className={[
          'relative w-full overflow-hidden',
          maxWidthClassName,
          styles.shell,
          containerClassName,
        ].join(' ')}
      >
        {/* subtle XPOT glow (cheap + effective) */}
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 left-[18%] h-[380px] w-[380px] rounded-full bg-amber-500/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {(title || subtitle || headerRightSlot || !hideClose) && (
          <div className="relative flex items-start justify-between gap-3 px-6 pb-3 pt-5">
            <div className="min-w-0">
              {title && (
                <h2 className={`text-sm font-semibold ${styles.title}`}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className={`mt-1 text-xs ${styles.subtitle}`}>
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {headerRightSlot}
              {!hideClose && (
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
              )}
            </div>
          </div>
        )}

        <div className={['relative px-6 pb-6', contentClassName].join(' ')}>
          {children}

          {footerSlot ? (
            <div className="mt-5">{footerSlot}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
