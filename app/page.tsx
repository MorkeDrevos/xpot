'use client';

import XpotPageShell from '@/components/XpotPageShell';
import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';

export default function HomePage() {
  return (
    <XpotPageShell>
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <JackpotPanel variant="standalone" />
        <BonusStrip />
      </div>
    </XpotPageShell>
  );
}
