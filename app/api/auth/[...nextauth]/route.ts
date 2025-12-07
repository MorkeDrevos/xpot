import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";

const handler = NextAuth({
  providers: [
    {
      id: "twitter",
      name: "X",
      type: "oauth",
      version: "2.0",
      scope: "tweet.read users.read offline.access",
      params: { grant_type: "authorization_code" },
      accessTokenUrl: "https://api.twitter.com/2/oauth2/token",
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          response_type: "code",
          code_challenge_method: "S256",
        },
      },
      token: {
        url: "https://api.twitter.com/2/oauth2/token",
      },
      userinfo: {
        url: "https://api.twitter.com/2/users/me",
        async request({ tokens }) {
          const res = await fetch("https://api.twitter.com/2/users/me", {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });
          const { data } = await res.json();
          return {
            id: data.id,
            name: data.name,
            username: data.username,
            image: data.profile_image_url,
          };
        },
      },
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: null,
          image: profile.image,
        };
      },
    },
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.user = user;
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
