// components/XpotAccessGate.tsx
'use client';

type Props = {
  children: React.ReactNode;
};

export default function XpotAccessGate({ children }: Props) {
  // TEMP: disable all auth / redirect logic
  return <>{children}</>;
}
