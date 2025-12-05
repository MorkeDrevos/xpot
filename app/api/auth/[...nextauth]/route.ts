// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

const handler = NextAuth({
  // We’ll just use signed JWT sessions for now – no DB adapter.
  session: {
    strategy: 'jwt',
  },

  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      // New X API uses OAuth 2.0
      version: '2.0',
    }),
  ],

  callbacks: {
    // Put useful data into the JWT when we first log in
    async jwt({ token, account, profile }) {
      // When the user just signed in
      if (account && profile) {
        // X user id
        token.sub = account.providerAccountId;

        // X handle / username (e.g. @MorkeDrevos)
        const p = profile as any;
        if (p && p.username) {
          token.username = p.username;
        }
      }

      return token;
    },

    // Expose those fields to the client
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        if (token.username) {
          (session.user as any).handle = token.username;
        }
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
