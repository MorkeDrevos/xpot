// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

// Support both naming styles so prod can't silently fail
const clientId =
  process.env.X_CLIENT_ID ??
  process.env.TWITTER_CLIENT_ID ??
  '';

const clientSecret =
  process.env.X_CLIENT_SECRET ??
  process.env.TWITTER_CLIENT_SECRET ??
  '';

if (!clientId || !clientSecret) {
  console.warn(
    '[auth] Missing X/Twitter clientId or clientSecret. ' +
      'Set X_CLIENT_ID / X_CLIENT_SECRET or TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET in Vercel.'
  );
}

const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      // IMPORTANT:
      // - id "x" => NextAuth exposes /api/auth/callback/x
      // - must match signIn('x') and X Dev Portal callback
      id: 'x',
      clientId,
      clientSecret,
      version: '2.0', // OAuth 2.0 (Twitter/X v2)
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user, profile }) {
      if (user) {
        token.name = user.name ?? token.name ?? null;
        (token as any).username =
          (user as any).username ??
          (token as any).username ??
          null;

        if (user.image) {
          token.picture = user.image;
        }
      }

      if (profile) {
        const p = profile as any;

        const rawUsername =
          p.username ??
          p.screen_name ??
          p.handle ??
          p.data?.username ??
          p.data?.screen_name ??
          null;

        const rawImage =
          p.profile_image_url ??
          p.profile_image_url_https ??
          p.data?.profile_image_url ??
          null;

        if (rawUsername && !(token as any).username) {
          (token as any).username = rawUsername;
        }

        if (rawImage && !token.picture) {
          token.picture = rawImage;
        }

        const rawVerified =
          typeof p.verified === 'boolean'
            ? p.verified
            : typeof p.verified_type === 'string'
            ? ['blue', 'business', 'government', 'organization'].includes(
                String(p.verified_type).toLowerCase()
              )
            : typeof p.data?.verified === 'boolean'
            ? p.data.verified
            : false;

        (token as any).verified =
          rawVerified ?? (token as any).verified ?? false;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).username =
          (token as any).username ??
          (session.user as any).username ??
          null;

        if (token.picture) {
          session.user.image = token.picture as string;
        }

        (session.user as any).verified =
          (token as any).verified ?? false;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
