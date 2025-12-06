// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  // Keep simple JWT sessions – no NextAuth DB needed
  session: {
    strategy: 'jwt',
  },

  providers: [
    TwitterProvider({
      // Support both naming styles – use whichever you actually set in Vercel
      clientId:
        process.env.TWITTER_CLIENT_ID ??
        process.env.X_CLIENT_ID ??
        '',
      clientSecret:
        process.env.TWITTER_CLIENT_SECRET ??
        process.env.X_CLIENT_SECRET ??
        '',
      version: '2.0',
    }),
  ],

  callbacks: {
    // 1) On sign-in, upsert into our Prisma User table
    async signIn({ user, account, profile }) {
      if (account?.provider === 'twitter' && profile) {
        try {
          const p = profile as any;

          const xId = account.providerAccountId ?? null;

          let handle =
            p?.data?.username ??
            p?.username ??
            p?.screen_name ??
            user?.name ??
            null;

          if (!handle && user?.email) {
            handle = user.email.split('@')[0];
          }

          if (!handle && xId) {
            handle = `x_${xId}`;
          }

          const avatarUrl =
            p?.data?.profile_image_url ??
            p?.profile_image_url ??
            p?.avatar_url ??
            null;

          const name =
            p?.data?.name ??
            p?.name ??
            user?.name ??
            null;

          console.log('X LOGIN PROFILE', JSON.stringify(p, null, 2));
          console.log('FINAL HANDLE', handle);
          console.log('PROVIDER ACCOUNT ID (xId)', xId);

          if (handle) {
            const dbUser = await prisma.user.upsert({
              // We keep using xHandle as the unique key so we don’t clash
              // with existing rows that were created before xId existed.
              where: { xHandle: handle },
              update: {
                xId: xId ?? undefined,
                xHandle: handle,
                xName: name ?? undefined,
                xAvatarUrl: avatarUrl ?? undefined,
              },
              create: {
                xId: xId ?? undefined,
                xHandle: handle,
                xName: name ?? undefined,
                xAvatarUrl: avatarUrl,
              },
            });

            // Attach DB user id so jwt() can see it
            (user as any).id = dbUser.id;
          }
        } catch (err) {
          console.error('XPOT upsert user failed:', err);
          // don’t block login if DB write explodes
        }
      }

      return true;
    },

    // 2) Put userId + handle + avatar into the JWT
    async jwt({ token, user, account, profile }) {
      // carry over DB user id from signIn
      if (user && (user as any).id) {
        (token as any).userId = (user as any).id;
      }

      if (account?.provider === 'twitter' && profile) {
        const p = profile as any;

        const handle =
          p?.data?.username ??
          p?.username ??
          p?.screen_name ??
          (token as any).xHandle;

        const avatarUrl =
          p?.data?.profile_image_url ??
          p?.profile_image_url ??
          (token as any).xAvatarUrl;

        (token as any).xHandle = handle;
        (token as any).xAvatarUrl = avatarUrl;
      }

      return token;
    },

    // 3) Expose userId + handle + avatar on session
    async session({ session, token }) {
      if (session.user) {
        (session as any).userId = (token as any).userId;
        (session.user as any).xHandle = (token as any).xHandle;
        (session.user as any).xAvatarUrl = (token as any).xAvatarUrl;
      }
      return session;
    },

    // 4) Always land on dashboard after login
    async redirect({ url, baseUrl }) {
      // Allow relative URLs like /dashboard
      if (url.startsWith('/')) return baseUrl + url;

      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {
        // ignore malformed URLs
      }

      // Fallback: go to dashboard
      return `${baseUrl}/dashboard`;
    },
  },

  // Helpful while we debug OAuthCallback issues
  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
