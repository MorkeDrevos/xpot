// app/admin/layout.tsx
import type { ReactNode } from 'react';

export const metadata = {
  title: 'XPOT Admin · Operations Center',
  description:
    'Internal XPOT console to manage entries, rewards and live system state.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="cinematic-bg min-h-screen px-3 py-6 lg:px-6">
      {children}
    </div>
  );
}
