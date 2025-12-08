// app/providers.tsx
'use client';

import React from 'react';

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  // No NextAuth / Clerk – just render children
  return <>{children}</>;
}
