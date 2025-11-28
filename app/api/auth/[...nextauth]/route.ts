// app/api/auth/[...nextauth]/route.ts
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
      id: 'x',                   // so our signIn('x') works
      clientId,
      clientSecret,
      version: '2.0',            // OAuth2

      // 👇 Ask X to *always* show a login / account screen
      authorization: {
        params: {
          // OAuth2 standard hint
          prompt: 'login',
          // Old Twitter-style hint (harmless if ignored)
          force_login: 'true' as any,
        },
      },
    }),
  ],

  session: { strategy: 'jwt' },

  // You can re-add your callbacks here if you had them before.
  // callbacks: { ... }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
