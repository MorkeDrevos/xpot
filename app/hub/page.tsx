// app/hub/page.tsx
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in?redirect_url=/hub');
  }

  return <DashboardClient />;
}
