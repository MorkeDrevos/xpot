// lib/xpotRun.ts

export const RUN_DAYS = 7000;

export const RUN_START_MADRID = { y: 2025, m: 12, d: 25, hh: 22, mm: 0 };
export const RUN_END_MADRID = { y: 2045, m: 2, d: 22, hh: 22, mm: 0 };

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function formatMadridEU(
  parts: { y: number; m: number; d: number; hh: number; mm: number },
  opts?: { withTime?: boolean; withTz?: boolean },
) {
  const withTime = opts?.withTime ?? true;
  const withTz = opts?.withTz ?? true;

  const date = `${pad2(parts.d)}/${pad2(parts.m)}/${parts.y}`;
  const time = `${pad2(parts.hh)}:${pad2(parts.mm)}`;

  if (!withTime) return date;
  return `${date} ${time}${withTz ? ' (Madrid)' : ''}`;
}

export const RUN_START_EU = formatMadridEU(RUN_START_MADRID);
export const RUN_END_EU = formatMadridEU(RUN_END_MADRID);
export const RUN_END_EU_SHORT = formatMadridEU(RUN_END_MADRID, { withTime: false, withTz: false });
