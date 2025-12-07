// app/sign-in/[[...sign-in]]/page.tsx
'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <SignIn routing="path" path="/sign-in" />
      </div>
    </main>
  );
}
