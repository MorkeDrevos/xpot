// lib/xpotFinalDay.ts

/**
 * XPOT timeline constants
 * First draw: 2025-12-25 (UTC)
 * Total draws: 7,000 (1 per day)
 */

export const FIRST_DRAW_DATE_UTC = new Date('2025-12-25T00:00:00Z');
export const TOTAL_DRAWS = 7000;

/**
 * Final draw date (UTC, computed)
 */
export function getFinalDrawDateUTC(): Date {
  const d = new Date(FIRST_DRAW_DATE_UTC);
  d.setUTCDate(d.getUTCDate() + TOTAL_DRAWS);
  return d;
}

/**
 * EU numeric format: DD/MM/YYYY
 */
export function getFinalDrawEU(): string {
  return getFinalDrawDateUTC().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * EU long format: 23 February 2045
 */
export function getFinalDrawEULong(): string {
  return getFinalDrawDateUTC().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
