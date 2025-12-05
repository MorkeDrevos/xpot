// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
  throw new Error('Missing Twitter OAuth env vars');
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET env var');
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    // you can change to 'jwt' later if you prefer,
    // but 'database' makes it very clear in Prisma
    strategy: 'database',
  },
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      // we only need basic read permissions
      version: '2.0',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Expose user id + handle so the app can use it easily
      if (session.user) {
        (session.user as any).id = user.id;
        // if you later store handle on the User model, you can map it here too
        // (session.user as any).handle = (user as any).handle ?? null;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
