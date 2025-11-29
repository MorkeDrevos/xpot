import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";

const handler = NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
      // Use OAuth 2.0
      version: "2.0",
    }),
  ],

  // Optional but keeps things tidy
  pages: {
    signIn: "/x-login", // or "/dashboard" if you don't use a separate sign-in page
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always send people back to the dashboard after signing in
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
});

export { handler as GET, handler as POST };
