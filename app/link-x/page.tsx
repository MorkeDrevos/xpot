// app/link-x/page.tsx
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import LinkXClient from './LinkXClient';

export const dynamic = 'force-dynamic';

function hasXLinked(user: any) {
  const accounts = user?.externalAccounts ?? [];
  return accounts.some((acc: any) => {
    const p = String(acc?.provider ?? '').toLowerCase();
    return p.includes('twitter') || p === 'oauth_x' || p === 'oauth_twitter' || p === 'twitter';
  });
}

export default async function LinkXPage({
  searchParams,
}: {
  searchParams?: { redirect_url?: string };
}) {
  const user = await currentUser();
  if (!user) redirect(`/sign-in?redirect_url=/link-x`);

  if (hasXLinked(user)) {
    redirect(searchParams?.redirect_url || '/hub');
  }

  return <LinkXClient redirectUrl={searchParams?.redirect_url || '/hub'} />;
}
