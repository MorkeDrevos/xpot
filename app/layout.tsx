// app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import XpotPageShell from '@/components/XpotPageShell';

export const metadata = {
  title: 'XPOT',
  description: 'The X-powered reward pool',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <XpotPageShell>
          {children}
        </XpotPageShell>
      </body>
    </html>
  );
}
