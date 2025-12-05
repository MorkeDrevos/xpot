// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

import { prisma } from '@/lib/prisma';

const handler = NextAuth({
  // Keep simple JWT sessions – no NextAuth DB needed
  session: {
    strategy: 'jwt',
  },

  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],

  callbacks: {
    // 1) On sign-in, upsert into our Prisma User table
    async signIn({ user, account, profile }) {
      if (account?.provider === 'twitter' && profile) {
        try {
          const p = profile as any;

          const handle =
            p?.data?.username ??
            p?.username ??
            p?.screen_name ??
            user?.name ??
            null;

          const avatarUrl =
            p?.data?.profile_image_url ??
            p?.profile_image_url ??
            p?.avatar_url ??
            null;

          if (handle) {
            await prisma.user.upsert({
              where: { xHandle: handle },
              update: {
                xAvatarUrl: avatarUrl ?? undefined,
              },
              create: {
                xHandle: handle,
                xAvatarUrl: avatarUrl,
              },
            });
          }
        } catch (err) {
          console.error('XPOT upsert user failed:', err);
          // don’t block login if DB write explodes
        }
      }

      return true;
    },

    // 2) Put handle + avatar into the JWT
    async jwt({ token, account, profile }) {
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

    // 3) Expose handle + avatar on session.user
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).xHandle = (token as any).xHandle;
        (session.user as any).xAvatarUrl = (token as any).xAvatarUrl;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
