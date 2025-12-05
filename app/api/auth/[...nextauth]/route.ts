// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

const handler = NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],
  pages: {
    signIn: '/what-is-xpot',
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        // @ts-ignore
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
