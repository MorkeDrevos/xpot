// components/XpotAccessGate.tsx
'use client';

import type { ReactNode } from 'react';

type XpotAccessGateProps = {
  children: ReactNode;
};

export default function XpotAccessGate({ children }: XpotAccessGateProps) {
  // Clerk removed – gate is now a simple pass-through
  return <>{children}</>;
}
