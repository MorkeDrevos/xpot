'use client';

import { ReactNode, useEffect } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md';
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses =
    size === 'sm' ? 'max-w-md' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4
                 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${sizeClasses}
                    rounded-2xl bg-slate-900/95 border border-amber-400/30
                    shadow-2xl shadow-black/70
                    text-slate-50`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-100
                     transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        {title && (
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
          </div>
        )}

        {/* Body */}
        <div className="px-6 pb-6 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
