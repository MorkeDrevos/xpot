// app/dashboard/sso-callback/[[...index]]/page.tsx
'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function DashboardSSOCallbackPage() {
  return (
    <main className="min-h-screen bg-black text-slate-50 flex items-center justify-center">
      <AuthenticateWithRedirectCallback />
    </main>
  );
}
