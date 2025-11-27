// app/dashboard/layout.tsx
import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth'; // wherever you keep this

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // If not logged in with X → send them to X login page
  if (!session) {
    redirect('/x-login'); // or '/' if you want landing first
  }

  // Session exists → show dashboard UI
  return <>{children}</>;
}
