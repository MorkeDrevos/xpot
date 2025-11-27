// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      id: 'x', // so signIn('x') works
      clientId: process.env.X_CLIENT_ID ?? '',
      clientSecret: process.env.X_CLIENT_SECRET ?? '',
      version: '2.0', // X OAuth2
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

        token.picture =
          (p.profile_image_url_https as string | undefined) ??
          (p.profile_image_url as string | undefined) ??
          (token.picture as string | undefined) ??
          null;

        token.username =
          (p.screen_name as string | undefined) ??
          (p.username as string | undefined) ??
          (p.login as string | undefined) ??
          (token as any).username ??
          null;

        // Real verified flags from X
        const rawVerified = (p as any).verified;
        const rawVerifiedType = (p as any).verified_type;

        (token as any).verified =
          typeof rawVerified === 'boolean' ? rawVerified : false;

        if (typeof rawVerifiedType === 'string') {
          (token as any).verified_type = rawVerifiedType;
        } else {
          delete (token as any).verified_type;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Make sure session.user exists
      if (!session.user) {
        session.user = {};
      }

      // Pass through identity from the token
      session.user.name = token.name as string | undefined;
      session.user.image = token.picture as string | undefined;
      (session.user as any).username = (token as any).username ?? null;
      (session.user as any).verified = (token as any).verified ?? false;
      (session.user as any).verified_type = (token as any).verified_type ?? null;

      return session;
    },

    // Optional: after login always land on /dashboard
    async redirect({ url, baseUrl }) {
      // If it's an absolute callback (X sending us back), ignore and go dashboard
      return `${baseUrl}/dashboard`;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
