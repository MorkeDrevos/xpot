// components/NebulaBackground.tsx
'use client';

import Lottie from 'lottie-react';
import nebula from '@/app/animations/xpot_nebula_pulse.json';

export default function NebulaBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 blur-2xl">
      <Lottie
        animationData={nebula as any}
        loop
        autoplay
        style={{
          width: '120%',
          height: '120%',
          transform: 'translate(-10%, -10%)',
        }}
      />
    </div>
  );
}
