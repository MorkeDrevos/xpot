// app/hub/page.tsx
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function hasXLinked(user: any) {
  const accounts = user?.externalAccounts ?? [];
  return accounts.some((acc: any) => {
    const p = String(acc?.provider ?? '').toLowerCase();
    return p.includes('twitter') || p === 'oauth_x' || p === 'oauth_twitter' || p === 'twitter';
  });
}

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) redirect('/sign-in?redirect_url=/hub');

  if (!hasXLinked(user)) {
    redirect('/link-x?redirect_url=/hub');
  }

  return <DashboardClient />;
}
