'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl">
        <SignIn routing="path" path="/sign-in" />
      </div>
    </main>
  );
}
