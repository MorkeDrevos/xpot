// lib/xpotRun.ts

export const RUN_DAYS = 7000;

// Madrid wall-clock cutoffs (day flips at 22:00 Europe/Madrid)
export const RUN_START = { y: 2025, m: 12, d: 25, hh: 22, mm: 0 } as const;

// If first draw is at RUN_START (Draw #1), then Draw #7000 is +6999 days:
export const RUN_END = { y: 2045, m: 2, d: 22, hh: 22, mm: 0 } as const;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function formatEuDateTime(
  dt: { y: number; m: number; d: number; hh: number; mm: number },
  opts?: { withTzLabel?: boolean; tzLabel?: string },
) {
  const withTzLabel = opts?.withTzLabel ?? true;
  const tzLabel = opts?.tzLabel ?? 'Madrid';
  const s = `${pad2(dt.d)}/${pad2(dt.m)}/${dt.y} ${pad2(dt.hh)}:${pad2(dt.mm)}`;
  return withTzLabel ? `${s} (${tzLabel})` : s;
}

// EU formatted strings (single source of truth)
export const RUN_START_EU = formatEuDateTime(RUN_START, { withTzLabel: true, tzLabel: 'Madrid' });
export const RUN_END_EU = formatEuDateTime(RUN_END, { withTzLabel: true, tzLabel: 'Madrid' });

export function getFinalDrawEULong() {
  return RUN_END_EU;
}

export function getFinalDrawEUShort() {
  // Short means: EU date only (still EU order)
  return `${pad2(RUN_END.d)}/${pad2(RUN_END.m)}/${RUN_END.y}`;
}
