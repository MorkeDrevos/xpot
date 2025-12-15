// app/hub/page.tsx
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <DashboardClient />;
}
