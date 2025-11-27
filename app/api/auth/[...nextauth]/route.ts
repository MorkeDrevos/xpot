import NextAuth from "next-auth";
import Twitter from "next-auth/providers/twitter";

const handler = NextAuth({
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID ?? "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET ?? "",
      version: "2.0",
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      // First time login – enrich token with Twitter profile data
      if (profile && account?.provider === "twitter") {
        const p = profile as any;
        token.name = p.name ?? token.name;
        token.picture =
          p.profile_image_url_https ||
          p.profile_image_url ||
          token.picture;
        // handle / @username
        token.username = p.screen_name || p.username || token.username;
        token.verified =
          typeof p.verified === "boolean" ? p.verified : token.verified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).username = token.username;
        (session.user as any).verified = token.verified;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
