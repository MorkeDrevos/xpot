// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";

const handler = NextAuth({
  session: { strategy: "jwt" },

  // Always use your own page, never NextAuth’s ugly one
  pages: {
    signIn: "/dashboard",
    error: "/dashboard",
  },

  providers: [
    TwitterProvider({
      // IMPORTANT:
      // Use your "API Key" as clientId
      // and your "API Key Secret" as clientSecret.
      clientId: process.env.TWITTER_CLIENT_ID!,       // = API Key
      clientSecret: process.env.TWITTER_CLIENT_SECRET!, // = API Key Secret
      // ❌ NO version: '2.0' here – this keeps it on OAuth 1.0a
    }),
  ],

  callbacks: {
    // No DB, no extra checks – just let X log you in
    async signIn() {
      return true;
    },

    async jwt({ token, account, profile }) {
      if (account?.provider === "twitter" && profile) {
        const p = profile as any;

        const handle =
          p?.screen_name ??
          p?.username ??
          token.xHandle ??
          null;

        const avatarUrl =
          p?.profile_image_url_https ??
          p?.profile_image_url ??
          token.xAvatarUrl ??
          null;

        (token as any).xHandle = handle;
        (token as any).xAvatarUrl = avatarUrl;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).xHandle = (token as any).xHandle;
        (session.user as any).xAvatarUrl = (token as any).xAvatarUrl;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return baseUrl + url;
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {
        // ignore
      }
      return baseUrl + "/dashboard";
    },
  },

  debug: process.env.NODE_ENV !== "production",
});

export { handler as GET, handler as POST };
