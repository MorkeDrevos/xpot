'use client';

import { getFinalDrawEU, getFinalDrawEULong } from '@/lib/xpotFinalDay';

export default function FinalDrawDate({
  variant = 'long',
}: {
  variant?: 'long' | 'short';
}) {
  return (
    <>
      {variant === 'short' ? getFinalDrawEU() : getFinalDrawEULong()}
    </>
  );
}
