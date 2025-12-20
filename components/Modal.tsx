// components/Modal.tsx
'use client';

import { ReactNode, useEffect, useId, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

type ModalTone = 'xpot-light' | 'xpot-dark';

type ModalSize = 'sm' | 'md' | 'lg';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;

  // Optional upgrades (all optional, backwards-compatible)
  tone?: ModalTone;
  size?: ModalSize;

  closeOnBackdrop?: boolean;
  showClose?: boolean;

  className?: string; // outer wrapper (rare)
  panelClassName?: string; // modal card
};

function sizeClass(size: ModalSize) {
  switch (size) {
    case 'sm':
      return 'max-w-sm';
    case 'lg':
      return 'max-w-2xl';
    case 'md':
    default:
      return 'max-w-md';
  }
}

/**
 * XPOT Modal (lightweight, premium)
 * - Uses portal to <body>
 * - Locks scroll while open
 * - ESC closes
 * - Click backdrop closes (optional)
 * - Basic focus trap (Tab stays inside)
 * - “Light” tone reduces heavy blur cost
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  tone = 'xpot-light',
  size = 'md',
  closeOnBackdrop = true,
  showClose = true,
  className = '',
  panelClassName = '',
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  const overlayCls = useMemo(() => {
    // Keep the overlay cheap: avoid large backdrop-blur by default.
    // If you *really* want blur, add it via className override.
    return tone === 'xpot-dark'
      ? 'bg-black/70'
      : 'bg-black/45';
  }, [tone]);

  const panelBase = useMemo(() => {
    const common =
      'relative w-[92vw] ' +
      sizeClass(size) +
      ' rounded-[28px] border shadow-2xl outline-none';

    if (tone === 'xpot-dark') {
      return (
        common +
        ' border-white/10 bg-slate-950/85 ' +
        'shadow-[0_24px_80px_rgba(0,0,0,0.55)]'
      );
    }

    // XPOT “light” glass: luminous edges + subtle gradient (premium, but light to render)
    return (
      common +
      ' border-white/10 bg-white/[0.06] ' +
      'shadow-[0_24px_90px_rgba(0,0,0,0.45)] ' +
      'backdrop-blur-[6px]'
    );
  }, [tone, size]);

  // Lock body scroll + restore focus
  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = document.activeElement as HTMLElement | null;

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    // Focus the panel on open (so ESC + tab trapping behaves)
    const t = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      document.documentElement.style.overflow = prevOverflow;
      lastActiveRef.current?.focus?.();
      lastActiveRef.current = null;
    };
  }, [open]);

  // ESC close + focus trap
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const root = panelRef.current;
      if (!root) return;

      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
          ].join(','),
        ),
      ).filter(el => !el.hasAttribute('data-modal-ignore'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div
      className={[
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        overlayCls,
        className,
      ].join(' ')}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? titleId : undefined}
      onMouseDown={e => {
        if (!closeOnBackdrop) return;
        // Only close when clicking the backdrop itself (not inside the panel)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Ambient glow (cheap): adds “XPOT premium” without heavy layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 500px at 50% 35%, rgba(56,189,248,0.10), transparent 60%),' +
            'radial-gradient(700px 420px at 55% 70%, rgba(236,72,153,0.10), transparent 62%)',
        }}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          panelBase,
          'overflow-hidden',
          panelClassName,
        ].join(' ')}
        onMouseDown={e => {
          // Prevent backdrop close if user starts drag inside panel
          e.stopPropagation();
        }}
      >
        {/* Top shine line */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)',
          }}
        />

        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            {title ? (
              <h2
                id={titleId}
                className="text-[13px] font-semibold tracking-[0.02em] text-slate-100"
              >
                {title}
              </h2>
            ) : (
              <span />
            )}

            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] hover:text-white"
                aria-label="Close"
              >
                <span className="text-sm leading-none">✕</span>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-5 pb-5 pt-4">{children}</div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
