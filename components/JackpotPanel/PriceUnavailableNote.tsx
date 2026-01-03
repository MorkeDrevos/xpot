// components/JackpotPanel/PriceUnavailableNote.tsx
'use client';

export function PriceUnavailableNote() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
      Price feed temporarily unavailable. Retrying…
    </div>
  );
}
