// app/providers.tsx
'use client';

import React from 'react';

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  // No NextAuth, no external providers for now – just render children
  return <>{children}</>;
}
