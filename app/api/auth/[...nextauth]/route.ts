// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      // use OAuth 2.0 on X
      version: '2.0',
    }),
  ],
  pages: {
    signIn: '/what-is-xpot', // your custom sign-in page
  },
  // (optional) basic cleanup of the session object
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        // @ts-ignore - extend session user at runtime
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
