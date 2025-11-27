import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "XPOT – The X-powered crypto jackpot",
  description: "One winner. One jackpot. Every day."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-50">{children}</body>
    </html>
  );
}
