import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

const handler = NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.username =
          profile.username ||
          profile.screen_name ||
          profile.data?.username ||
          null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).username = token.username;
      }
      return session;
    },
  },

  pages: {
    signIn: '/dashboard',
    error: '/dashboard',
  },
});

export { handler as GET, handler as POST };
