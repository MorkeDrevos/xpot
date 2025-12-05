// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

const handler = NextAuth({
  // Use Prisma so X logins are stored in the DB
  adapter: PrismaAdapter(prisma),

  // Keep JWT sessions (DB is for users/accounts, not sessions)
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
    // Runs whenever a JWT is created/updated
    async jwt({ token, account, profile }) {
      // On first login / account link we get account+profile
      if (account && profile) {
        // Basic identity info from X
        const p = profile as any;

        token.name = p.name ?? token.name;
        token.picture =
          p.profile_image_url_https ??
          p.profile_image_url ??
          token.picture;

        // X handle (e.g. @MorkeDrevos)
        token.username =
          p.screen_name ??
          p.username ??
          (token as any).username;
      }

      return token;
    },

    // What your React app receives as `session`
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as any;

        // NextAuth user id (from Prisma)
        if (token.sub) {
          u.id = token.sub;
        }

        // X handle
        if ((token as any).username) {
          u.username = (token as any).username;
        }

        if (token.name) {
          u.name = token.name;
        }
        if (token.picture) {
          u.image = token.picture as string;
        }
      }

      return session;
    },
  },
});

export { handler as GET, handler as POST };
