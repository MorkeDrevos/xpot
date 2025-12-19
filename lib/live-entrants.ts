// lib/live-entrants.ts

export type LiveEntrant = {
  handle: string;
  avatarUrl?: string;
  followers?: number;
  verified?: boolean;

  /**
   * Optional per-entrant label.
   * Examples:
   * "VIP", "Winner", "OG", "Verified", "Team", "Sponsor"
   */
  subtitle?: string;
};

/**
 * Normalizes an X handle (removes @, trims, keeps casing clean)
 */
export function cleanHandle(h: string) {
  return (h || '').replace(/^@/, '').trim();
}

/**
 * Internal normalization logic.
 * Accepts unknown input and returns a safe LiveEntrant or null.
 */
export function normalizeLiveEntrant(x: unknown): LiveEntrant | null {
  if (!x) return null;

  // Allow shorthand string form: "@user"
  if (typeof x === 'string') {
    const handle = cleanHandle(x);
    return handle ? { handle } : null;
  }

  if (typeof x !== 'object') return null;
  const obj = x as Record<string, unknown>;

  if (typeof obj.handle !== 'string' || !obj.handle.trim()) return null;

  const out: LiveEntrant = {
    handle: cleanHandle(obj.handle),
  };

  if (typeof obj.avatarUrl === 'string' && obj.avatarUrl.trim()) {
    out.avatarUrl = obj.avatarUrl.trim();
  }

  if (typeof obj.followers === 'number' && Number.isFinite(obj.followers)) {
    out.followers = obj.followers;
  }

  if (typeof obj.verified === 'boolean') {
    out.verified = obj.verified;
  }

  if (typeof obj.subtitle === 'string' && obj.subtitle.trim()) {
    out.subtitle = obj.subtitle.trim();
  }

  return out;
}

/**
 * Canonical alias used by UI layers.
 * DO NOT REMOVE.
 * This prevents naming drift and broken imports.
 */
export const asLiveEntrant = normalizeLiveEntrant;
