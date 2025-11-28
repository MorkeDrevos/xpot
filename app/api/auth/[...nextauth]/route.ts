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
  // This will show up in Vercel logs if env vars are missing / wrong
  console.warn(
    '[auth] Missing X/Twitter clientId or clientSecret. Check X_CLIENT_ID / X_CLIENT_SECRET or TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET.'
  );
}

const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      // IMPORTANT: this must match:
      // - signIn('x', ...) in /x-login
      // - /api/auth/callback/x in X Dev Portal
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
      // On first sign in, enrich the token with X profile / user data
      // `user` is what the provider's `profile()` returns (id, name, username, image)
      // `profile` is the raw provider profile (shape can vary), so we guard heavily.

      if (user) {
        // Basic identity from NextAuth user object
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

        // Try to grab username / image from possible raw shapes as a safety net
        // (Twitter v2 often exposes data under profile.data.*)
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

        // "Real" verified flag from X profile – try multiple shapes, default false
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
        // username / handle
        (session.user as any).username =
          (token as any).username ??
          (session.user as any).username ??
          null;

        // avatar
        if (token.picture) {
          session.user.image = token.picture as string;
        }

        // verified flag used by the UI
        (session.user as any).verified =
          (token as any).verified ?? false;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
