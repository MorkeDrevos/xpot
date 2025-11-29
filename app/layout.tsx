import './globals.css'
import type { ReactNode } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
