// app/admin/page.tsx

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import AdminClient from './AdminClient';

export default function AdminPage() {
  return <AdminClient />;
}
