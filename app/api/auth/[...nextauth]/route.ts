import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import type { NextAuthOptions } from 'next-auth';

import { prisma } from '@/lib/prisma';

// ✅ Export this so other routes can use it
export const authOptions: NextAuthOptions = {
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

          if (!handle && user?.email) handle = user.email.split('@')[0];
          if (!handle && xId) handle = `x_${xId}`;

          const avatar =
            p?.data?.profile_image_url ??
            p?.profile_image_url ??
            null;

          const name =
            p?.data?.name ??
            user?.name ??
            null;

          const dbUser = await prisma.user.upsert({
            where: { xHandle: handle },
            update: {
              xId: xId ?? undefined,
              xName: name ?? undefined,
              xAvatarUrl: avatar ?? undefined,
            },
            create: {
              xId: xId ?? undefined,
              xHandle: handle,
              xName: name ?? undefined,
              xAvatarUrl: avatar,
            },
          });

          (user as any).id = dbUser.id;

        } catch (err) {
          console.error('X login DB error', err);
        }
      }
      return true;
    },

    async jwt({ token, user, account, profile }) {
      if (user && (user as any).id) {
        (token as any).userId = (user as any).id;
      }

      if (profile) {
        const p = profile as any;
        (token as any).xHandle =
          p?.data?.username ??
          p?.username ??
          p?.screen_name ??
          (token as any).xHandle;

        (token as any).xAvatarUrl =
          p?.data?.profile_image_url ??
          p?.profile_image_url ??
          (token as any).xAvatarUrl;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session as any).userId = (token as any).userId;
        (session.user as any).xHandle = (token as any).xHandle;
        (session.user as any).xAvatarUrl = (token as any).xAvatarUrl;
      }
      return session;
    },
  },
};

// ✅ NextAuth handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
