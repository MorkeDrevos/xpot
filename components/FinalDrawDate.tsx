// components/FinalDrawDate.tsx
'use client';

import { getFinalDrawEUShort, getFinalDrawEULong } from '@/lib/xpotRun';

export default function FinalDrawDate({
  variant = 'long',
  className = '',
}: {
  variant?: 'long' | 'short';
  className?: string;
}) {
  const value = variant === 'short' ? getFinalDrawEUShort() : getFinalDrawEULong();
  return <span className={className}>{value}</span>;
}
