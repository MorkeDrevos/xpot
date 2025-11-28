// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

// ─────────────────────────────────────────────
// Env – only use X_CLIENT_ID / X_CLIENT_SECRET
// ─────────────────────────────────────────────

const clientId = process.env.X_CLIENT_ID;
const clientSecret = process.env.X_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  // This will show clearly in /api/auth/error if something is missing
  throw new Error(
    'Missing X_CLIENT_ID or X_CLIENT_SECRET env vars for NextAuth Twitter/X provider.'
  );
}

// ─────────────────────────────────────────────
// NextAuth config
// ─────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== 'production',

  providers: [
    TwitterProvider({
      // MUST match /api/auth/callback/x and signIn('x', ...) in /x-login
      id: 'x',
      clientId,
      clientSecret,
      version: '2.0', // use OAuth 2.0
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user, profile }) {
      // Basic identity
      if (user) {
        token.name = user.name ?? token.name ?? null;
        (token as any).username =
          (user as any).username ?? (token as any).username ?? null;

        if (user.image) {
          token.picture = user.image;
        }
      }

      // Extra safety: try to pull username/image/verified from raw profile
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

// Next.js App Router handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
