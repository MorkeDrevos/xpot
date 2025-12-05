// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import { prisma } from '@/lib/prisma';

// ENV VARS you’ll set in Vercel:
// X_CLIENT_ID, X_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL

const authOptions: NextAuthOptions = {
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
    // Where to send people when they click “Sign in with X”
    signIn: '/what-is-xpot',
  },

  callbacks: {
    // Runs on sign-in & token refresh
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const p: any = profile;
        const core = p?.data ?? p;

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

          // Attach to JWT
          (token as any).userId = user.id;
          (token as any).xId = user.xId;
          (token as any).xHandle = user.xHandle;
          (token as any).xName = user.xName;
          (token as any).xAvatarUrl = user.xAvatarUrl;
        }
      }

      return token;
    },

    // What the frontend sees in useSession()
    async session({ session, token }) {
      (session as any).userId = (token as any).userId;

      session.user = {
        ...(session.user ?? {}),
        name:
          (token as any).xName ??
          session.user?.name ??
          undefined,
        image:
          (token as any).xAvatarUrl ??
          session.user?.image ??
          undefined,
        handle: (token as any).xHandle ?? null,
      } as any;

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
