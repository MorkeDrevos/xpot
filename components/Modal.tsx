// components/Modal.tsx
'use client';

import { ReactNode, useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';

export type ModalTone = 'default' | 'xpot-light' | 'xpot-dark';

type ModalProps = {
  open: boolean;
  onClose: () => void;

  title?: string;
  children: ReactNode;

  tone?: ModalTone;
  maxWidthClassName?: string;

  /** Optional: hide the default header row completely */
  hideHeader?: boolean;

  /** Optional: custom right-side header content */
  headerRightSlot?: ReactNode;

  /** Optional: aria label override (when title not provided) */
  ariaLabel?: string;
};

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    // Prevent layout shift when scrollbar disappears
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [locked]);
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  tone = 'default',
  maxWidthClassName = 'max-w-md',
  hideHeader = false,
  headerRightSlot,
  ariaLabel,
}: ModalProps) {
  const headingId = useId();
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const ui = useMemo(() => {
    if (!open) return null;

    const shell =
      tone === 'xpot-light'
        ? {
            backdrop:
              'bg-black/55 backdrop-blur-xl',
            panel:
              [
                'rounded-[28px] border border-white/10',
                'bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_58%),linear-gradient(to_bottom,rgba(2,6,23,0.72),rgba(2,6,23,0.56))]',
                'shadow-[0_40px_160px_rgba(0,0,0,0.78)]',
                'backdrop-blur-xl',
              ].join(' '),
            ambient:
              [
                'pointer-events-none absolute -top-24 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full blur-3xl',
                'bg-[radial-gradient(circle,rgba(168,85,247,0.18),transparent_60%)]',
              ].join(' '),
            ambient2:
              [
                'pointer-events-none absolute -bottom-28 left-[18%] h-[340px] w-[340px] rounded-full blur-3xl',
                'bg-[radial-gradient(circle,rgba(245,158,11,0.14),transparent_60%)]',
              ].join(' '),
            closeBtn:
              'rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10',
            title:
              'text-sm font-semibold text-slate-100',
          }
        : tone === 'xpot-dark'
        ? {
            backdrop: 'bg-black/70 backdrop-blur-2xl',
            panel:
              'rounded-2xl border border-slate-800 bg-slate-950 shadow-[0_30px_120px_rgba(0,0,0,0.85)]',
            ambient: '',
            ambient2: '',
            closeBtn:
              'rounded-full px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100',
            title:
              'text-sm font-semibold text-slate-100',
          }
        : {
            backdrop: 'bg-black/60 backdrop-blur-sm',
            panel:
              'rounded-2xl border border-slate-800 bg-slate-950 shadow-xl',
            ambient: '',
            ambient2: '',
            closeBtn:
              'rounded-full px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100',
            title:
              'text-sm font-semibold text-slate-100',
          };

    return (
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? headingId : undefined}
        aria-label={!title ? ariaLabel || 'Modal' : undefined}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className={`absolute inset-0 ${shell.backdrop}`}
        />

        {/* Panel */}
        <div
          className={[
            'relative w-full',
            maxWidthClassName,
            shell.panel,
            'overflow-hidden',
          ].join(' ')}
        >
          {tone === 'xpot-light' && (
            <>
              <div aria-hidden className={shell.ambient} />
              <div aria-hidden className={shell.ambient2} />
              {/* tiny highlight line */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />
            </>
          )}

          {!hideHeader && (
            <div className="relative flex items-center justify-between gap-3 px-5 pt-5">
              <div className="min-w-0">
                {title ? (
                  <h2 id={headingId} className={shell.title}>
                    {title}
                  </h2>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {headerRightSlot}
                <button
                  type="button"
                  onClick={onClose}
                  className={shell.closeBtn}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <div className="relative px-5 pb-5 pt-4">{children}</div>
        </div>
      </div>
    );
  }, [open, onClose, title, children, tone, maxWidthClassName, hideHeader, headerRightSlot, ariaLabel, headingId]);

  if (!open) return null;

  return createPortal(ui, document.body);
}
