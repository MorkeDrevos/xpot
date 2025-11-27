// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      id: 'x', // so signIn('x') works
      clientId: process.env.X_CLIENT_ID ?? '',
      clientSecret: process.env.X_CLIENT_SECRET ?? '',
      version: '2.0', // OAuth2
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign in, enrich the token with X profile data
      if (profile) {
        const p = profile as any;

        // Basic identity
        token.name =
          (p.name as string | undefined) ??
          (token.name as string | undefined) ??
          null;

        token.username =
          (p.username as string | undefined) ??
          (p.screen_name as string | undefined) ??
          ((token as any).username as string | undefined) ??
          null;

        token.picture =
          (p.profile_image_url as string | undefined) ??
          (p.profile_image_url_https as string | undefined) ??
          (token.picture as string | undefined) ??
          null;

        // "Real" verified flag from X profile
        const rawVerified =
          typeof p.verified === 'boolean'
            ? p.verified
            : typeof p.verified_type === 'string'
            ? ['blue', 'business', 'government', 'organization'].includes(
                (p.verified_type as string).toLowerCase()
              )
            : false;

        (token as any).verified = rawVerified;
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
        (session.user as any).verified = (token as any).verified ?? false;
      }

      return session;
    },
  },
};

// Create the route handler for Next.js App Router
const handler = NextAuth(authOptions);

// Only export GET / POST – nothing else
export { handler as GET, handler as POST };
