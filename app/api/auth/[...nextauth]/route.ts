// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import { prisma } from '@/lib/prisma';

// ENV VARS (on Vercel):
// X_CLIENT_ID, X_CLIENT_SECRET, NEXTAUTH_URL, NEXTAUTH_SECRET

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    // you can change this later if you want a custom sign-in page
    signIn: '/what-is-xpot',
  },

  callbacks: {
    // Runs on sign-in and whenever the token is refreshed
    async jwt({ token, account, profile }) {
      // Only run user sync when we have fresh X data
      if (account && profile) {
        const anyProfile: any = profile;
        const core = anyProfile?.data ?? anyProfile;

        const xId: string | undefined = core?.id?.toString();
        const username: string | undefined = core?.username;
        const name: string | undefined = core?.name;

        const avatar: string | undefined =
          core?.profile_image_url ||
          core?.profile_image_url_https ||
          core?.profile_image_url_https_200x200 ||
          core?.profile_image_url_https_400x400 ||
          core?.profile_image_url_https_800x800 ||
          core?.profile_image_url;

        if (xId) {
          const handle = username ? `@${username}` : null;

          const user = await prisma.user.upsert({
            where: { xId },
            create: {
              xId,
              xHandle: handle,
              xName: name ?? null,
              xAvatarUrl: avatar ?? null,
            },
            update: {
              xHandle: handle ?? undefined,
              xName: name ?? undefined,
              xAvatarUrl: avatar ?? undefined,
            },
          });

          token.userId = user.id;
          token.xId = user.xId;
          token.xHandle = user.xHandle;
          token.xName = user.xName;
          token.xAvatarUrl = user.xAvatarUrl;
        }
      }

      return token;
    },

    // What your React app sees in useSession()
    async session({ session, token }) {
      (session as any).userId = (token as any).userId;

      session.user = {
        ...(session.user ?? {}),
        name: (token as any).xName ?? session.user?.name ?? undefined,
        image:
          (token as any).xAvatarUrl ?? session.user?.image ?? undefined,
        handle: (token as any).xHandle ?? null,
      } as any;

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
