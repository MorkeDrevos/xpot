import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";

const handler = NextAuth({
  session: { strategy: "jwt" },

  pages: {
    signIn: "/dashboard",
    error: "/dashboard",
  },

  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn() {
      return true;
    },

    async jwt({ token }) {
      return token;
    },

    async session({ session }) {
      return session;
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },

  debug: true,
});

export { handler as GET, handler as POST };
