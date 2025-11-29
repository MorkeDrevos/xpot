import NextAuth, { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

// Make sure these env vars are set in Vercel:
// X_CLIENT_ID, X_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL

const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      id: 'twitter',
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // When we first sign in, enrich the token with Twitter data
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
      // Expose username + picture on session.user
      if (session.user) {
        (session.user as any).username = token.username ?? null;
        session.user.image = (token.picture as string | undefined) ?? session.user.image;
        session.user.name = token.name as string | undefined;
      }

      return session;
    },
  },

  pages: {
    signIn: '/dashboard', // we use the modal on /dashboard
  },

  session: {
    strategy: 'jwt',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
