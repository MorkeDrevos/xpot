export type LiveEntrant = Readonly<{
  handle: string;
  avatarUrl?: string; // must come from API (optional, UI can filter)
  followers?: number;
  verified?: boolean;
}>;

// Enforces "no extra keys" when creating objects
export type Exact<Base, Shape extends Base> = Base &
  Record<Exclude<keyof Shape, keyof Base>, never>;

export function asLiveEntrant<T extends LiveEntrant>(x: Exact<LiveEntrant, T>): LiveEntrant {
  return x;
}
