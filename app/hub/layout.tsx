import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XPOT Hub',
  description: 'Your XPOT dashboard',
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
