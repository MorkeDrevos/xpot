// app/dashboard/history/page.tsx
'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import HistoryClient from './HistoryClient';

export default function HistoryPage() {
  return <HistoryClient />;
}
