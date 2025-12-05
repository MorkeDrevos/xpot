// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";

import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  // Simple JWT sessions – no NextAuth DB tables
  session: {
    strategy: "jwt",
  },

  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
  ],

  callbacks: {
    // 1) On sign-in, upsert into our Prisma User table
    async signIn({ user, account, profile }) {
      if (account?.provider === "twitter" && profile) {
        try {
          const p = profile as any;

          // Stable X identity
          const xId = account.providerAccountId ?? null;

          let handle =
            p?.data?.username ??
            p?.username ??
            p?.screen_name ??
            user?.name ??
            null;

          if (!handle && user?.email) {
            handle = user.email.split("@")[0];
          }

          if (!handle && xId) {
            handle = `x_${xId}`;
          }

          console.log("X LOGIN PROFILE", JSON.stringify(p, null, 2));
          console.log("FINAL HANDLE", handle);

          const avatarUrl =
            p?.data?.profile_image_url ??
            p?.profile_image_url ??
            p?.avatar_url ??
            null;

          if (handle) {
            await prisma.user.upsert({
              // xHandle is unique in schema
              where: { xHandle: handle },
              update: {
                xId: xId ?? undefined,
                xAvatarUrl: avatarUrl ?? undefined,
              },
              create: {
                xId: xId ?? undefined,
                xHandle: handle,
                xName: p?.data?.name ?? p?.name ?? user?.name ?? null,
                xAvatarUrl: avatarUrl,
              },
            });
          }
        } catch (err) {
          console.error("XPOT upsert user failed:", err);
          // Don’t block login if DB write explodes
        }
      }

      return true;
    },

    // 2) JWT: keep handle + avatar + DB userId on the token
    async jwt({ token, account, profile }) {
      if (account?.provider === "twitter") {
        const p = profile as any | undefined;

        const handle =
          p?.data?.username ??
          p?.username ??
          p?.screen_name ??
          (token as any).xHandle;

        const avatarUrl =
          p?.data?.profile_image_url ??
          p?.profile_image_url ??
          (token as any).xAvatarUrl;

        (token as any).xHandle = handle;
        (token as any).xAvatarUrl = avatarUrl;

        // Attach DB user id so the app can use session.user.id
        if (handle) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { xHandle: handle },
              select: { id: true },
            });

            if (dbUser) {
              (token as any).userId = dbUser.id;
            }
          } catch (err) {
            console.error("XPOT jwt user lookup failed:", err);
          }
        }
      }

      return token;
    },

    // 3) Session: expose handle, avatar, and userId on session.user
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).userId;
        (session.user as any).xHandle = (token as any).xHandle;
        (session.user as any).xAvatarUrl = (token as any).xAvatarUrl;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
