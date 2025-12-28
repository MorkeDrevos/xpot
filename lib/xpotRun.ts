// lib/xpotRun.ts

export const RUN_DAYS = 7000;

// Madrid wall-clock cutoffs (day flips at 22:00 Europe/Madrid)
// ✅ Fresh run start: 2025-12-28 22:00 Madrid
export const RUN_START = { y: 2025, m: 12, d: 28, hh: 22, mm: 0 } as const;

type RunDt = { y: number; m: number; d: number; hh: number; mm: number };

const DAY_MS = 86_400_000;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

// Add whole days based on the *calendar date* (UTC-safe day stepping)
// We intentionally ignore DST here because we're moving the date, not the wall-clock time.
function addDaysToYmd(ymd: { y: number; m: number; d: number }, days: number) {
  const base = Date.UTC(ymd.y, ymd.m - 1, ymd.d);
  const end = new Date(base + days * DAY_MS);
  return { y: end.getUTCFullYear(), m: end.getUTCMonth() + 1, d: end.getUTCDate() };
}

/**
 * End of run (Final Draw cutoff).
 *
 * IMPORTANT:
 * If "Day 1 starts at RUN_START (22:00 Madrid)",
 * then the Final Draw happens after 7000 full days have elapsed:
 * RUN_END = RUN_START date + RUN_DAYS days (same 22:00 cutoff time).
 *
 * This makes the final draw date: 26/02/2045 (not 25/02/2045) for this run start.
 */
export const RUN_END: RunDt = (() => {
  const endYmd = addDaysToYmd({ y: RUN_START.y, m: RUN_START.m, d: RUN_START.d }, RUN_DAYS);
  return { ...endYmd, hh: RUN_START.hh, mm: RUN_START.mm };
})();

export function formatEuDateTime(dt: RunDt, opts?: { withTzLabel?: boolean; tzLabel?: string }) {
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
