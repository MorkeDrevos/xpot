import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";

const handler = NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.username =
          token?.username || token?.screen_name || token?.sub;
      }
      return session;
    },

    async jwt({ token, profile }) {
      if (profile) {
        token.username = profile.username || profile.screen_name;
      }
      return token;
    },
  },
});

export { handler as GET, handler as POST };
