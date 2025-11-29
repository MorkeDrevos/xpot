import NextAuth, { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

// Env vars expected (set in Vercel):
// - X_CLIENT_ID
// - X_CLIENT_SECRET
// - NEXTAUTH_SECRET
// - NEXTAUTH_URL

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
      // Cast to any so TS doesn't complain about extra fields
      const t = token as any;
      const p = profile as any;

      if (account && p) {
        t.username =
          p.username ||
          p.screen_name ||
          p.data?.username ||
          null;

        t.picture = p.profile_image_url || t.picture || null;
        t.name = p.name || t.name || null;
      }

      return token;
    },

    async session({ session, token }) {
      const t = token as any;

      if (session.user) {
        (session.user as any).username = t.username ?? null;
        session.user.image = (t.picture as string | undefined) ?? session.user.image;
        session.user.name = (t.name as string | undefined) ?? session.user.name;
      }

      return session;
    },
  },

  pages: {
    // We don't use a standalone sign-in page,
    // the dashboard shows the modal instead.
    signIn: '/dashboard',
  },

  session: {
    strategy: 'jwt',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
