import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { prisma } from "@/lib/prisma";

export const authOptions = {
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
    // 1) Upsert User in Prisma on X login
    async signIn({ user, account, profile }: any) {
      if (account?.provider === "twitter" && profile) {
        try {
          const p = profile as any;
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

          const avatarUrl =
            p?.data?.profile_image_url ??
            p?.profile_image_url ??
            p?.avatar_url ??
            null;

          if (handle) {
            await prisma.user.upsert({
              where: { xHandle: handle },
              update: {
                xId: xId ?? undefined,
                xAvatarUrl: avatarUrl ?? undefined,
                xName: p?.data?.name ?? p?.name ?? user?.name ?? null,
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
        }
      }

      return true;
    },

    // 2) Attach DB userId to JWT
    async jwt({ token, account, profile }: any) {
      if (account?.provider === "twitter") {
        const p = profile as any | undefined;

        const handle =
          p?.data?.username ??
          p?.username ??
          p?.screen_name ??
          token.xHandle;

        const avatarUrl =
          p?.data?.profile_image_url ??
          p?.profile_image_url ??
          token.xAvatarUrl;

        token.xHandle = handle;
        token.xAvatarUrl = avatarUrl;

        if (handle) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { xHandle: handle },
              select: { id: true },
            });

            if (dbUser) token.userId = dbUser.id;
          } catch (err) {
            console.error("JWT DB lookup failed:", err);
          }
        }
      }

      return token;
    },

    // 3) Expose on session.user
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.xHandle = token.xHandle;
        session.user.xAvatarUrl = token.xAvatarUrl;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
