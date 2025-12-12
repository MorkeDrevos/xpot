// app/hub/page.tsx

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return <DashboardClient />;
}
