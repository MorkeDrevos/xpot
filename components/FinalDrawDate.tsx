// components/FinalDrawDate.tsx
'use client';

import { RUN_END_MADRID, formatMadridEU } from '@/lib/xpotRun';

export default function FinalDrawDate({
  variant = 'full',
  withTz = true,
  className = '',
}: {
  variant?: 'full' | 'short';
  withTz?: boolean;
  className?: string;
}) {
  const text =
    variant === 'short'
      ? formatMadridEU(RUN_END_MADRID, { withTime: false, withTz: false })
      : formatMadridEU(RUN_END_MADRID, { withTime: true, withTz });

  return <span className={className}>{text}</span>;
}
