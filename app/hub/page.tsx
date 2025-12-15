// app/hub/page.tsx
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in?redirect_url=/hub');
  }

  return <DashboardClient />;
}
