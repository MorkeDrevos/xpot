// lib/live-entrants.ts
export type LiveEntrant = {
  handle: string;
  avatarUrl?: string;
  followers?: number;
  verified?: boolean;

  // Optional per-entrant label (this is what “subtitle per entrant” means)
  // Example uses: "VIP", "Winner", "OG", "Verified", "Team", "Sponsor", etc
  subtitle?: string;
};

export function cleanHandle(h: string) {
  return (h || '').replace(/^@/, '').trim();
}

export function normalizeLiveEntrant(x: unknown): LiveEntrant | null {
  if (!x) return null;

  if (typeof x === 'string') return { handle: cleanHandle(x) };

  if (typeof x !== 'object') return null;
  const obj = x as any;

  if (typeof obj.handle !== 'string' || !obj.handle.trim()) return null;

  const out: LiveEntrant = { handle: cleanHandle(obj.handle) };

  if (typeof obj.avatarUrl === 'string' && obj.avatarUrl.trim()) out.avatarUrl = obj.avatarUrl.trim();
  if (typeof obj.followers === 'number' && Number.isFinite(obj.followers)) out.followers = obj.followers;
  if (typeof obj.verified === 'boolean') out.verified = obj.verified;
  if (typeof obj.subtitle === 'string' && obj.subtitle.trim()) out.subtitle = obj.subtitle.trim();

  return out;
}
