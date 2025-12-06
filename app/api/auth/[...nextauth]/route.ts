// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },

  // Always use your own page, never the default NextAuth screens
  pages: {
    signIn: '/dashboard',
    error: '/dashboard',
  },

  providers: [
    TwitterProvider({
      // ❗ These MUST be the X "API Key" + "API Key Secret" (Consumer Keys section)
      // NOT the OAuth 2.0 Client ID/Secret
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      // No "version: '2.0'" here – this uses OAuth 1.0a
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // First login: attach X data to the token
      if (account?.provider === 'twitter' && profile) {
        const p = profile as any;

        const handle =
          p?.screen_name ??
          p?.username ??
          (token as any).xHandle ??
          null;

        const avatarUrl =
          p?.profile_image_url_https ??
          p?.profile_image_url ??
          (token as any).xAvatarUrl ??
          null;

        if (handle) (token as any).xHandle = handle;
        if (avatarUrl) (token as any).xAvatarUrl = avatarUrl;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).xHandle = (token as any).xHandle ?? null;
        (session.user as any).xAvatarUrl = (token as any).xAvatarUrl ?? null;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Always land back on dashboard after auth
      if (url.startsWith('/')) return baseUrl + url;
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {
        // ignore
      }
      return `${baseUrl}/dashboard`;
    },
  },

  debug: process.env.NODE_ENV !== 'production',
  logger: {
    error(code, meta) {
      console.error('[NEXTAUTH ERROR]', code, meta);
    },
    warn(code) {
      console.warn('[NEXTAUTH WARN]', code);
    },
    debug(code, meta) {
      console.log('[NEXTAUTH DEBUG]', code, meta);
    },
  },
};

const handler = NextAuth(authOptions);

// ✅ Only these exports – nothing else
export { handler as GET, handler as POST };
