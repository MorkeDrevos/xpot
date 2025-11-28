// app/api/auth/[...nextauth]/route.ts  (or pages/api/auth/[...nextauth].ts)

import NextAuth, { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      // IMPORTANT: this id must match signIn('x', ...) on the client
      id: 'x',
      name: 'X',
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],

  // Send users back to the dashboard for sign in + errors
  pages: {
    signIn: '/dashboard',
    error: '/dashboard',
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always end up on /dashboard after auth unless you explicitly pass another callbackUrl
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      try {
        const target = new URL(url);
        if (target.origin === baseUrl) return url;
      } catch {
        // ignore malformed urls
      }
      return `${baseUrl}/dashboard`;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
