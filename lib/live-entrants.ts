export type LiveEntrant = Readonly<{
  handle: string;
  avatarUrl: string; // required once it reaches the client UI
  followers?: number;
  verified?: boolean;
}>;

// Utility to enforce "no extra keys" when building objects
export type Exact<Base, Shape extends Base> = Base &
  Record<Exclude<keyof Shape, keyof Base>, never>;

// Use this whenever you create a LiveEntrant object literal
export function asLiveEntrant<T extends LiveEntrant>(x: Exact<LiveEntrant, T>): LiveEntrant {
  return x;
}
