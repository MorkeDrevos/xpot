'use client';

import { useEffect } from 'react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const saved = localStorage.getItem('xpot_theme');
    if (saved) {
      document.documentElement.dataset.theme = saved;
    } else {
      document.documentElement.dataset.theme = 'nebula';
    }
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
