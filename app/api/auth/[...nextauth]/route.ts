// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import { prisma } from '@/lib/prisma';

const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },

  // Always use your own page, never the built-in ugly one
  pages: {
    signIn: '/dashboard',  // "Sign in with X" lives here
    error: '/dashboard',   // on any auth error, go back here too
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

            (user as any).id = dbUser.id;
          }
        } catch (err) {
          console.error('XPOT upsert user failed:', err);
        }
      }
      return true;
    },

    async jwt({ token, user, account, profile }) {
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

    async session({ session, token }) {
      if (session.user) {
        (session as any).userId = (token as any).userId;
        (session.user as any).xHandle = (token as any).xHandle;
        (session.user as any).xAvatarUrl = (token as any).xAvatarUrl;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return baseUrl + url;
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {}
      return `${baseUrl}/dashboard`;
    },
  },

  debug: process.env.NODE_ENV !== 'production',

  logger: {
    error(code, metadata) {
      console.error('⚠️ NEXTAUTH ERROR', code, metadata);
    },
    warn(code) {
      console.warn('⚠️ NEXTAUTH WARN', code);
    },
    debug(code, metadata) {
      console.log('🧠 NEXTAUTH DEBUG', code, metadata);
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
