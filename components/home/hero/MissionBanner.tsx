// components/home/hero/MissionBanner.tsx
'use client';

import RotatingAnnouncement from '@/components/RotatingAnnouncement';

export default function MissionBanner({ reservesHref }: { reservesHref: string }) {
  return (
    <div className="relative border-y border-slate-900/60 bg-slate-950/55 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_18%_20%,rgba(var(--xpot-gold),0.18),transparent_60%),radial-gradient(circle_at_82%_0%,rgba(56,189,248,0.16),transparent_62%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <RotatingAnnouncement reservesHref={reservesHref} />
      </div>
    </div>
  );
}
