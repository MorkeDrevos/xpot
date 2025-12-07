'use client';

import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function XpotAccessGate({ children }: Props) {
  // TEMPORARY OPEN GATE
  // This keeps your dashboard working while we rebuild access logic cleanly later.

  return <>{children}</>;
}
