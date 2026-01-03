// components/JackpotPanel/tooltip.tsx
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { clamp } from './utils';

export function useAnchoredTooltip<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const update = () => {
    if (!ref.current) return;
    setRect(ref.current.getBoundingClientRect());
  };

  useEffect(() => {
    if (!open) return;
    update();

    const onMove = () => update();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);

    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { ref, open, setOpen, rect };
}

export function TooltipBubble({
  open,
  rect,
  width = 380,
  children,
}: {
  open: boolean;
  rect: DOMRect | null;
  width?: number;
  children: ReactNode;
}) {
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [h, setH] = useState<number>(160);

  useEffect(() => {
    if (!open) return;
    const el = bubbleRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.height && Number.isFinite(r.height)) setH(r.height);
  }, [open]);

  if (!open || !rect) return null;
  if (typeof window === 'undefined') return null;
  if (typeof document === 'undefined') return null;

  const pad = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const maxW = Math.max(240, vw - pad * 2);
  const w = clamp(width, 240, maxW);

  const anchorCenterX = rect.left + rect.width / 2;
  const EDGE_ZONE = 220;

  let left = 0;
  if (anchorCenterX > vw - EDGE_ZONE) {
    left = clamp(rect.right - w, pad, vw - w - pad);
  } else if (anchorCenterX < EDGE_ZONE) {
    left = clamp(rect.left, pad, vw - w - pad);
  } else {
    left = clamp(anchorCenterX - w / 2, pad, vw - w - pad);
  }

  const belowTop = rect.bottom + 10;
  const aboveTop = rect.top - 10 - h;

  const fitsBelow = belowTop + h <= vh - pad;
  const top = fitsBelow ? belowTop : clamp(aboveTop, pad, vh - h - pad);

  const arrowX = clamp(anchorCenterX - left, 22, w - 22);
  const arrowIsTop = fitsBelow;

  return createPortal(
    <div
      ref={bubbleRef}
      className="pointer-events-none fixed z-[9999] rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-[0_18px_40px_rgba(15,23,42,0.92)] backdrop-blur-xl"
      style={{ left, top, width: w, opacity: 1, transform: 'translateY(4px)' }}
    >
      <div
        className={[
          'absolute h-3.5 w-3.5 rotate-45 bg-slate-950/95 shadow-[0_4px_10px_rgba(15,23,42,0.7)] border-slate-700/80',
          arrowIsTop ? '-top-1.5 border-l border-t' : '-bottom-1.5 border-r border-b',
        ].join(' ')}
        style={{ left: arrowX - 7 }}
      />
      {children}
    </div>,
    document.body,
  );
}
