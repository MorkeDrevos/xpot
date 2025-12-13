// app/page.tsx
'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import JackpotPanel from '../components/JackpotPanel';
import BonusStrip from '../components/BonusStrip';
import XpotPageShell from '../components/XpotPageShell';

export default function HomePage() {
  return (
    <XpotPageShell
      title="XPOT"
      subtitle="One protocol. One identity. One daily XPOT draw."
      showHeader
      showTopBar
    >
      <div className="space-y-6">
        <BonusStrip />
        <JackpotPanel variant="standalone" />
      </div>
    </XpotPageShell>
  );
}
