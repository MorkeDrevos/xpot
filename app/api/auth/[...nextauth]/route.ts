import NextAuth from "next-auth";
import Twitter from "next-auth/providers/twitter";

// Wrap Twitter provider but rename it to "x" so the callback URL matches
const XProvider = {
  ...Twitter({
    clientId: process.env.X_CLIENT_ID!,
    clientSecret: process.env.X_CLIENT_SECRET!,
    version: "2.0", // OAuth 2.0
  }),
  id: "x",   // <-- callback will be /api/auth/callback/x
  name: "X",
};

const handler = NextAuth({
  providers: [XProvider],
  callbacks: {
    async jwt({ token, profile, account }) {
      // First time login – enrich token with X profile data
      if (profile && account?.provider === "x") {
        // Twitter v2 sometimes wraps data under .data
        const raw = profile as any;
        const p = raw.data ?? raw;

        token.name = p.name ?? token.name;

        token.picture =
          p.profile_image_url_https ||
          p.profile_image_url ||
          token.picture;

        // @username
        token.username =
          p.screen_name || p.username || token.username;

        // blue check
        if (typeof p.verified === "boolean") {
          token.verified = p.verified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).username = token.username;
        (session.user as any).verified = token.verified;
        (session.user as any).image = token.picture ?? session.user.image;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
