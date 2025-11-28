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

if (!clientId || !clientSecret) {
  console.warn('Missing X/Twitter client credentials for NextAuth.');
}

const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== 'production',

  providers: [
    TwitterProvider({
      id: 'x',              // so we sign in with "x", not "twitter"
      clientId,
      clientSecret,
      version: '2.0',       // OAuth2

      // Ask X to show the login / consent screen instead of silently reusing
      authorization: {
        params: {
          prompt: 'login',
        },
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, account, profile }) {
      // When user signs in, copy useful stuff from X profile into the token
      if (account && profile) {
        const p = profile as any;
        token.username =
          p.username ??
          p.screen_name ??
          p.preferred_username ??
          token.username;

        token.name = p.name ?? token.name;
        token.picture = p.profile_image_url ?? token.picture;
        token.verified = p.verified ?? token.verified;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose username / verified on session.user
      if (session.user) {
        (session.user as any).username = token.username;
        (session.user as any).verified = token.verified;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
