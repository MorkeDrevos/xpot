// app/layout.tsx
import './globals.css';

import { ClerkProvider } from '@clerk/nextjs';

export const metadata = {
  title: 'XPOT',
  description: 'Daily XPOT draws on Solana',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
