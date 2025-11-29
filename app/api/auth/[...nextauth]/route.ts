import NextAuth, { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

// Uses TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET from Vercel

const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      id: 'twitter',               // the id we call in signIn('twitter', ...)
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const p = profile as any;

        token.username =
          p.username ||
          p.screen_name ||
          p.data?.username ||
          null;

        token.picture = p.profile_image_url || token.picture || null;
        token.name = p.name || token.name || null;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).username = token.username ?? null;
        session.user.image = (token.picture as string | undefined) ?? session.user.image;
        session.user.name = token.name as string | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: '/dashboard',
  },

  session: {
    strategy: 'jwt',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
