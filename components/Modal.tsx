// components/Modal.tsx
'use client';

import { ReactNode, useEffect, useId, useMemo } from 'react';

type ModalTone = 'default' | 'xpot-light' | 'xpot-dark';

type ModalProps = {
  open: boolean;
  onClose: () => void;

  title?: string;
  children: ReactNode;

  // ✅ NEW
  tone?: ModalTone;
  maxWidthClassName?: string; // e.g. "max-w-2xl"
  showClose?: boolean;
  closeLabel?: string;

  // If you want to keep it open on backdrop click
  closeOnBackdrop?: boolean;

  // Optional header content on the right (chips, status pill, etc.)
  headerRightSlot?: ReactNode;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  tone = 'default',
  maxWidthClassName = 'max-w-md',
  showClose = true,
  closeLabel = 'Close',
  closeOnBackdrop = true,
  headerRightSlot,
}: ModalProps) {
  const headingId = useId();

  // Scroll lock + Escape close
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

  const toneClasses = useMemo(() => {
    // “Light” in XPOT terms = lighter glass + cleaner borders + warm gold micro highlights
    if (tone === 'xpot-light') {
      return {
        backdrop: 'bg-black/65 backdrop-blur-2xl',
        panel:
          'border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-slate-100 shadow-[0_40px_160px_rgba(0,0,0,0.75)]',
        header: 'border-b border-white/10',
        title: 'text-[13px] font-semibold text-slate-100 tracking-[0.02em]',
        close:
          'border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]',
      };
    }

    if (tone === 'xpot-dark') {
      return {
        backdrop: 'bg-black/70 backdrop-blur-xl',
        panel:
          'border border-white/10 bg-gradient-to-b from-slate-950/85 to-slate-950/55 text-slate-100 shadow-[0_40px_160px_rgba(0,0,0,0.80)]',
        header: 'border-b border-white/10',
        title: 'text-[13px] font-semibold text-slate-100 tracking-[0.02em]',
        close:
          'border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]',
      };
    }

    // default = your old look but slightly nicer
    return {
      backdrop: 'bg-black/60 backdrop-blur-sm',
      panel:
        'border border-slate-800 bg-slate-950 text-slate-100 shadow-xl',
      header: 'border-b border-white/5',
      title: 'text-sm font-semibold text-slate-100',
      close: 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
    };
  }, [tone]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center px-4 ${toneClasses.backdrop}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? headingId : undefined}
      onMouseDown={e => {
        if (!closeOnBackdrop) return;
        // Only close when clicking the backdrop, not the panel
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* XPOT “breathing” ambience for light tone */}
      {tone === 'xpot-light' ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="xpot-modal-breath xpot-modal-breath-a" />
          <div className="xpot-modal-breath xpot-modal-breath-b" />
          <div className="xpot-modal-grain" />
        </div>
      ) : null}

      <div
        className={[
          'relative w-full',
          maxWidthClassName,
          'rounded-[28px] overflow-hidden',
          toneClasses.panel,
        ].join(' ')}
        onMouseDown={e => e.stopPropagation()}
      >
        {(title || showClose || headerRightSlot) && (
          <div className={`flex items-center justify-between gap-3 px-5 py-4 ${toneClasses.header}`}>
            <div className="min-w-0">
              {title ? (
                <h2 id={headingId} className={`${toneClasses.title} truncate`}>
                  {title}
                </h2>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {headerRightSlot ? <div className="hidden sm:block">{headerRightSlot}</div> : null}

              {showClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className={[
                    'inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition',
                    tone === 'default' ? '' : 'backdrop-blur',
                    toneClasses.close,
                  ].join(' ')}
                  aria-label={closeLabel}
                >
                  {tone === 'default' ? '✕' : closeLabel}
                </button>
              ) : null}
            </div>
          </div>
        )}

        <div className="relative px-5 py-5">{children}</div>
      </div>

      {/* styled-jsx for the breathing/glow (self-contained, no globals needed) */}
      <style jsx>{`
        .xpot-modal-breath {
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 9999px;
          filter: blur(60px);
          opacity: 0.20;
          animation: xpotBreath 7.5s ease-in-out infinite;
          transform: translate3d(0, 0, 0);
        }
        .xpot-modal-breath-a {
          left: 50%;
          top: 38%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle at 30% 30%, rgba(236, 72, 153, 0.55), transparent 60%),
            radial-gradient(circle at 70% 70%, rgba(99, 102, 241, 0.45), transparent 62%);
        }
        .xpot-modal-breath-b {
          left: 22%;
          top: 62%;
          width: 460px;
          height: 460px;
          background: radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.40), transparent 62%),
            radial-gradient(circle at 70% 70%, rgba(56, 189, 248, 0.30), transparent 64%);
          animation-delay: -2.5s;
        }
        .xpot-modal-grain {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background-image:
            radial-gradient(circle at 18% 42%, rgba(255,255,255,0.22) 0px, transparent 1.6px),
            radial-gradient(circle at 72% 34%, rgba(255,255,255,0.18) 0px, transparent 1.5px),
            radial-gradient(circle at 46% 78%, rgba(255,255,255,0.16) 0px, transparent 1.4px),
            radial-gradient(circle at 88% 66%, rgba(255,255,255,0.14) 0px, transparent 1.4px);
          background-size: 520px 120px;
          animation: xpotDrift 10s linear infinite;
        }
        @keyframes xpotBreath {
          0%, 100% { transform: translate(-50%, -50%) scale(0.98); opacity: 0.18; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.26; }
        }
        @keyframes xpotDrift {
          0% { background-position: 0px 0px; }
          100% { background-position: 520px 0px; }
        }
      `}</style>
    </div>
  );
}
