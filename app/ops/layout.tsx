import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XPOT Ops',
  description: 'XPOT Operations Center',
};

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
