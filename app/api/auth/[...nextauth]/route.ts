
import NextAuth, { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

const clientId =
  process.env.X_CLIENT_ID ??
  process.env.TWITTER_CLIENT_ID ??
  '';

const clientSecret =
  process.env.X_CLIENT_SECRET ??
  process.env.TWITTER_CLIENT_SECRET ??
  '';

const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== 'production',

  providers: [
    TwitterProvider({
      id: 'x',                 // => /api/auth/callback/x
      clientId,
      clientSecret,
      version: '2.0',          // ← this is what tells NextAuth to use OAuth2
    }),
  ],

  session: { strategy: 'jwt' },
  // callbacks ... (as you already have)
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
