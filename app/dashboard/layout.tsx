// app/dashboard/layout.tsx
import type { ReactNode } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // no globals import, no Clerk, just pass-through
  return <>{children}</>;
}
