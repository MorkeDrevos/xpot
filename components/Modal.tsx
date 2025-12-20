// components/Modal.tsx
'use client';

import { ReactNode, useEffect, useMemo } from 'react';

export type ModalTone = 'dark' | 'xpot-light';

export type ModalProps = {
  open: boolean;
  onClose: () => void;

  // Optional default header (can be hidden)
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;

  // Accessibility
  ariaLabel?: string;

  // Layout
  maxWidthClassName?: string; // e.g. "max-w-md" | "max-w-3xl"
  className?: string; // wrapper class
  cardClassName?: string; // card class override
  contentClassName?: string; // inner padding/content wrapper

  // Behavior
  closeOnBackdrop?: boolean;
  hideClose?: boolean;

  // Styling
  tone?: ModalTone;

  // Slots
  headerRightSlot?: ReactNode;
  footerSlot?: ReactNode;

  children: ReactNode;
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  hideHeader = false,
  ariaLabel,
  maxWidthClassName = 'max-w-md',
  className,
  cardClassName,
  contentClassName,
  closeOnBackdrop = true,
  hideClose = false,
  tone = 'dark',
  headerRightSlot,
  footerSlot,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  const styles = useMemo(() => {
    if (tone === 'xpot-light') {
      return {
        backdrop: 'bg-black/70 backdrop-blur-2xl',
        card: [
          'border border-white/10',
          'bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.08),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.08),transparent_50%),radial-gradient(circle_at_30%_110%,rgba(236,72,153,0.08),transparent_55%),linear-gradient(to_bottom,rgba(15,23,42,0.72),rgba(2,6,23,0.58))]',
          'shadow-[0_40px_140px_rgba(0,0,0,0.82)]',
          'backdrop-blur-xl',
        ].join(' '),
        title: 'text-slate-100',
        subtitle: 'text-slate-300',
        close: 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
        divider: 'border-white/10',
      };
    }

    return {
      backdrop: 'bg-black/60 backdrop-blur-sm',
      card: 'border border-slate-800 bg-slate-950 shadow-xl',
      title: 'text-slate-100',
      subtitle: 'text-slate-400',
      close: 'hover:bg-slate-800 text-slate-400 hover:text-slate-100',
      divider: 'border-slate-800',
    };
  }, [tone]);

  if (!open) return null;

  return (
    <div
      className={[
        'fixed inset-0 z-[90] flex items-center justify-center px-4',
        styles.backdrop,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title || 'Modal'}
    >
      {/* Backdrop click catcher */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />

      {/* Card */}
      <div
        className={[
          'relative w-full overflow-hidden rounded-[28px]',
          maxWidthClassName,
          styles.card,
          cardClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Top hairline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* Header (optional) */}
        {!hideHeader && (title || subtitle || !hideClose || headerRightSlot) ? (
          <div className="px-5 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {title ? (
                  <h2 className={['text-sm font-semibold', styles.title].join(' ')}>
                    {title}
                  </h2>
                ) : null}
                {subtitle ? (
                  <p className={['mt-1 text-xs', styles.subtitle].join(' ')}>
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {headerRightSlot}
                {!hideClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className={[
                      'rounded-full px-3 py-2 text-xs font-semibold',
                      styles.close,
                    ].join(' ')}
                  >
                    Close
                  </button>
                ) : null}
              </div>
            </div>

            <div className={['mt-4 border-t', styles.divider].join(' ')} />
          </div>
        ) : null}

        {/* Content */}
        <div className={['px-5 py-5', contentClassName].filter(Boolean).join(' ')}>
          {children}
        </div>

        {/* Footer slot */}
        {footerSlot ? (
          <div className={['border-t px-5 py-4', styles.divider].join(' ')}>
            {footerSlot}
          </div>
        ) : null}
      </div>
    </div>
  );
}
