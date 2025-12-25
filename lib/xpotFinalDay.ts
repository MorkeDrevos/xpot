// lib/xpotRun.ts

export const RUN_DAYS = 7000;

// Draw #1 happens at this Madrid wall-clock time.
export const RUN_START_MADRID = { y: 2025, m: 12, d: 25, hh: 22, mm: 0 };

// Draw #7000 = draw #1 + 6999 days (same cutoff time)
export const RUN_END_MADRID = { y: 2045, m: 2, d: 22, hh: 22, mm: 0 };

type MadridParts = typeof RUN_END_MADRID;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function formatMadridEU(parts: MadridParts, opts?: { withTime?: boolean; withTz?: boolean }) {
  const withTime = opts?.withTime ?? true;
  const withTz = opts?.withTz ?? true;

  const date = `${pad2(parts.d)}/${pad2(parts.m)}/${parts.y}`;
  const time = `${pad2(parts.hh)}:${pad2(parts.mm)}`;

  if (!withTime) return date;
  return `${date} ${time}${withTz ? ' (Madrid)' : ''}`;
}

// Handy preformatted strings (for meta tags, logs, etc.)
export const RUN_START_EU = formatMadridEU(RUN_START_MADRID, { withTime: true, withTz: true });
export const RUN_END_EU = formatMadridEU(RUN_END_MADRID, { withTime: true, withTz: true });
export const RUN_END_EU_SHORT = formatMadridEU(RUN_END_MADRID, { withTime: false, withTz: false });
