// types/next-auth.d.ts
import type { DefaultSession } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    userId?: string;
    user: {
      /** X handle like "@damianxpot" */
      handle?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    xId?: string | null;
    xHandle?: string | null;
    xName?: string | null;
    xAvatarUrl?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    xId?: string | null;
    xHandle?: string | null;
    xName?: string | null;
    xAvatarUrl?: string | null;
  }
}
