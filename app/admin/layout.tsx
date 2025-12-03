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
  children: React.ReactNode;
}) {
  return children;
}
